
import mongoose from 'mongoose';
import {
  Course,
  ClassSlot,
  ClassException,
  MakeupClass,
  Deadline,
  Attendance
} from '../models/index.js';
import {
  days,
  isDate,
  assertFields,
  assertTimeRange,
  bad,
  overlaps
} from '../utils/validators.js';
import { removeCourseTree, toClient } from '../services/dataService.js';

const defs = {
  courses: {
    model: Course,
    fields: ['code', 'name', 'color'],
    required: ['code', 'name']
  },
  slots: {
    model: ClassSlot,
    fields: ['courseId', 'day', 'start', 'end', 'room'],
    required: ['courseId', 'day', 'start', 'end']
  },
  exceptions: {
    model: ClassException,
    fields: ['slotId', 'date'],
    required: ['slotId', 'date']
  },
  makeupClasses: {
    model: MakeupClass,
    fields: ['courseId', 'date', 'start', 'end', 'room'],
    required: ['courseId', 'date', 'start', 'end']
  },
  deadlines: {
    model: Deadline,
    fields: ['courseId', 'title', 'type', 'dueDate', 'dueTime', 'completed'],
    required: ['courseId', 'title', 'type', 'dueDate', 'dueTime']
  },
  attendance: {
    model: Attendance,
    fields: ['courseId', 'sessionId', 'date', 'status'],
    required: ['courseId', 'sessionId', 'date', 'status']
  }
};

const clean = (body, fields) =>
  Object.fromEntries(
    fields
      .filter(key => Object.hasOwn(body || {}, key))
      .map(key => [key, body[key]])
  );

const validId = value => mongoose.isValidObjectId(value);

const weekday = date =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'UTC'
  });

async function validate(kind, data, owner, id) {
  if (
    data.courseId &&
    (!validId(data.courseId) ||
      !(await Course.exists({ _id: data.courseId, owner })))
  ) {
    bad('Course not found', 404);
  }

  if (
    data.slotId &&
    (!validId(data.slotId) ||
      !(await ClassSlot.exists({ _id: data.slotId, owner })))
  ) {
    bad('Class slot not found', 404);
  }

  if (kind === 'courses') {
    if (
      typeof data.code !== 'string' ||
      !data.code.trim() ||
      typeof data.name !== 'string' ||
      !data.name.trim()
    ) {
      bad('Course code and name are required');
    }

    const escapedCode = data.code
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const duplicate = await Course.exists({
      owner,
      code: {
        $regex: `^${escapedCode}$`,
        $options: 'i'
      },
      ...(id ? { _id: { $ne: id } } : {})
    });

    if (duplicate) {
      bad('Course code already exists', 409);
    }
  }

  if (kind === 'slots' || kind === 'makeupClasses') {
    assertTimeRange(data.start, data.end);

    if (kind === 'slots' && !days.includes(data.day)) {
      bad('Invalid weekday');
    }

    if (kind === 'makeupClasses' && !isDate(data.date)) {
      bad('Invalid date');
    }

    if (kind === 'slots') {
      const existing = await ClassSlot.find({
        owner,
        day: data.day,
        ...(id ? { _id: { $ne: id } } : {})
      });

      if (existing.some(slot => overlaps(slot, data))) {
        bad('Class time clashes with an existing slot', 409);
      }
    }
  }

  if (
    ['exceptions', 'attendance'].includes(kind) &&
    !isDate(data.date)
  ) {
    bad('Invalid date');
  }

  if (
    kind === 'deadlines' &&
    (!isDate(data.dueDate) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.dueTime))
  ) {
    bad('Invalid deadline date/time');
  }

  if (kind === 'exceptions') {
    const slot = await ClassSlot.findOne({
      _id: data.slotId,
      owner
    });

    if (!slot) {
      bad('Class slot not found', 404);
    }

    if (weekday(data.date) !== slot.day) {
      bad('Cancellation date does not match weekly slot day');
    }

    const duplicate = await ClassException.exists({
      owner,
      slotId: data.slotId,
      date: data.date,
      ...(id ? { _id: { $ne: id } } : {})
    });

    if (duplicate) {
      bad('Class already cancelled for this date', 409);
    }
  }

  if (kind === 'attendance') {
    if (!['Present', 'Absent'].includes(data.status)) {
      bad('Invalid attendance status');
    }

    if (
      typeof data.sessionId !== 'string' ||
      !data.sessionId.trim()
    ) {
      bad('Session is required');
    }

    if (validId(data.sessionId)) {
      const slot = await ClassSlot.findOne({
        _id: data.sessionId,
        owner,
        courseId: data.courseId
      });

      const makeup = slot
        ? null
        : await MakeupClass.findOne({
            _id: data.sessionId,
            owner,
            courseId: data.courseId
          });

      if (!slot && !makeup) {
        bad('Session does not belong to this course', 400);
      }

      if (slot && weekday(data.date) !== slot.day) {
        bad('Attendance date does not match weekly class day');
      }

      if (
        slot &&
        (await ClassException.exists({
          owner,
          slotId: slot._id,
          date: data.date
        }))
      ) {
        bad('Cannot record attendance for a cancelled class');
      }

      if (makeup && makeup.date !== data.date) {
        bad('Attendance date does not match makeup class');
      }
    }

    const duplicate = await Attendance.exists({
      owner,
      courseId: data.courseId,
      sessionId: data.sessionId,
      date: data.date,
      ...(id ? { _id: { $ne: id } } : {})
    });

    if (duplicate) {
      bad('Attendance already recorded for this session', 409);
    }
  }
}

export function crud(kind) {
  const { model, fields, required } = defs[kind];

  return {
    list: async (req, res) => {
      const records = await model
        .find({ owner: req.user.id })
        .sort({ createdAt: -1 });

      res.json(records.map(toClient));
    },

    create: async (req, res) => {
      const data = clean(req.body, fields);

      assertFields(data, required);
      await validate(kind, data, req.user.id);

      const doc = await model.create({
        ...data,
        owner: req.user.id
      });

      res.status(201).json(toClient(doc));
    },

    update: async (req, res) => {
      if (!validId(req.params.id)) {
        bad('Record not found', 404);
      }

      const existing = await model.findOne({
        _id: req.params.id,
        owner: req.user.id
      });

      if (!existing) {
        bad('Record not found', 404);
      }

      const changes = clean(req.body, fields);

      const merged = {
        ...existing.toObject(),
        ...changes
      };

      await validate(
        kind,
        merged,
        req.user.id,
        req.params.id
      );

      Object.assign(existing, changes);
      await existing.save();

      res.json(toClient(existing));
    },

    remove: async (req, res) => {
      if (!validId(req.params.id)) {
        bad('Record not found', 404);
      }

      const existing = await model.findOne({
        _id: req.params.id,
        owner: req.user.id
      });

      if (!existing) {
        bad('Record not found', 404);
      }

      if (kind === 'courses') {
        await removeCourseTree(req.user.id, req.params.id);
      } else {
        if (kind === 'slots') {
          await ClassException.deleteMany({
            owner: req.user.id,
            slotId: existing._id
          });

          await Attendance.deleteMany({
            owner: req.user.id,
            sessionId: String(existing._id)
          });
        }

        if (kind === 'makeupClasses') {
          await Attendance.deleteMany({
            owner: req.user.id,
            sessionId: String(existing._id)
          });
        }

        await existing.deleteOne();
      }

      res.json({ message: 'Deleted' });
    }
  };
}
