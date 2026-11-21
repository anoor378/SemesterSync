
import { randomBytes } from 'node:crypto';
import {
  SharedTimetable,
  Course,
  ClassSlot
} from '../models/index.js';
import { toClient } from '../services/dataService.js';
import { bad } from '../utils/validators.js';

const normalizeCode = value => {
  if (typeof value !== 'string') {
    bad('Invalid share code');
  }

  const code = value.trim().toUpperCase();

  if (!/^[A-F0-9]{12}$/.test(code)) {
    bad('Invalid share code');
  }

  return code;
};

export async function createShare(req, res) {
  const owner = req.user.id;

  const [courses, slots] = await Promise.all([
    Course.find({ owner }),
    ClassSlot.find({ owner })
  ]);

  if (courses.length === 0) {
    bad('Add at least one course before sharing');
  }

  let share = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const code = randomBytes(6)
        .toString('hex')
        .toUpperCase();

      share = await SharedTimetable.create({
        owner,
        code,
        courses: courses.map(toClient),
        slots: slots.map(toClient)
      });

      break;
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  if (!share) {
    bad('Could not generate a unique share code', 503);
  }

  res.status(201).json({
    code: share.code
  });
}

export async function previewShare(req, res) {
  const code = normalizeCode(req.params.code);

  const snapshot = await SharedTimetable.findOne({
    code
  });

  if (!snapshot) {
    bad('Share code not found', 404);
  }

  res.json({
    code: snapshot.code,
    courses: snapshot.courses,
    slots: snapshot.slots
  });
}

export async function copyShare(req, res) {
  const code = normalizeCode(req.params.code);

  const snapshot = await SharedTimetable.findOne({
    code
  });

  if (!snapshot) {
    bad('Share code not found', 404);
  }

  const owner = req.user.id;

  const existingCourses = await Course.find({ owner });
  const existingSlots = await ClassSlot.find({ owner });

  const existingCodes = new Set(
    existingCourses.map(course =>
      course.code.toLowerCase()
    )
  );

  const incomingCodes = new Set();

  for (const course of snapshot.courses) {
    if (
      !course.id ||
      !course.code ||
      !course.name
    ) {
      bad('Invalid shared timetable data');
    }

    const key = String(course.code).toLowerCase();

    if (existingCodes.has(key)) {
      bad(
        `Course ${course.code} already exists in your timetable`,
        409
      );
    }

    if (incomingCodes.has(key)) {
      bad('Shared timetable contains duplicate courses');
    }

    incomingCodes.add(key);
  }

  const validDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  const validTime = value =>
    typeof value === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

  const incomingSlots = [];

  for (const slot of snapshot.slots) {
    if (
      !snapshot.courses.some(
        course => String(course.id) ===
          String(slot.courseId)
      )
    ) {
      bad('Shared slot references an unknown course');
    }

    if (
      !validDays.includes(slot.day) ||
      !validTime(slot.start) ||
      !validTime(slot.end) ||
      slot.start >= slot.end
    ) {
      bad('Shared timetable contains an invalid class');
    }

    incomingSlots.push(slot);
  }

  const allSlots = [
    ...existingSlots.map(slot => ({
      day: slot.day,
      start: slot.start,
      end: slot.end
    }))
  ];

  for (const slot of incomingSlots) {
    const conflict = allSlots.some(existing =>
      existing.day === slot.day &&
      existing.start < slot.end &&
      slot.start < existing.end
    );

    if (conflict) {
      bad('Shared timetable has overlapping classes', 409);
    }

    allSlots.push(slot);
  }

  const mapping = new Map();
  const createdCourses = [];
  const createdSlots = [];

  try {
    for (const course of snapshot.courses) {
      const created = await Course.create({
        owner,
        code: course.code,
        name: course.name,
        color: course.color || '#8974e8'
      });

      createdCourses.push(created._id);

      mapping.set(
        String(course.id),
        created._id
      );
    }

    for (const slot of incomingSlots) {
      const created = await ClassSlot.create({
        owner,
        courseId: mapping.get(String(slot.courseId)),
        day: slot.day,
        start: slot.start,
        end: slot.end,
        room: slot.room || ''
      });

      createdSlots.push(created._id);
    }

    res.status(201).json({
      coursesCopied: createdCourses.length,
      slotsCopied: createdSlots.length
    });
  } catch (error) {
    if (createdSlots.length) {
      await ClassSlot.deleteMany({
        owner,
        _id: { $in: createdSlots }
      });
    }

    if (createdCourses.length) {
      await Course.deleteMany({
        owner,
        _id: { $in: createdCourses }
      });
    }

    throw error;
  }
}
