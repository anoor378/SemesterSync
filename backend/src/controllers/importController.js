
import { parse } from 'csv-parse/sync';
import { Course, ClassSlot } from '../models/index.js';
import {
  days,
  isTime,
  overlaps,
  bad
} from '../utils/validators.js';

const field = (row, ...names) => {
  for (const name of names) {
    if (row[name] !== undefined) {
      return String(row[name] ?? '').trim();
    }
  }
  return '';
};

function validateRows(rows, existing = []) {
  const used = [...existing];
  const names = new Map();

  return rows.map((row, i) => {
    const errors = [];

    const v = {
      code: field(
        row,
        'code',
        'courseCode',
        'course_code',
        'Course Code'
      ),
      name: field(
        row,
        'name',
        'courseName',
        'course_name',
        'Course Name'
      ),
      day: field(
        row,
        'day',
        'weekday',
        'Weekday'
      ),
      start: field(
        row,
        'start',
        'startTime',
        'start_time',
        'Start Time'
      ),
      end: field(
        row,
        'end',
        'endTime',
        'end_time',
        'End Time'
      ),
      room: field(row, 'room', 'Room')
    };

    if (!v.code || !v.name) {
      errors.push('Course code/name required');
    }

    if (!days.includes(v.day)) {
      errors.push('Invalid weekday');
    }

    if (
      !isTime(v.start) ||
      !isTime(v.end) ||
      v.start >= v.end
    ) {
      errors.push('Invalid time range');
    }

    const key = v.code.toLowerCase();

    if (
      names.has(key) &&
      names.get(key) !== v.name.toLowerCase()
    ) {
      errors.push(
        'Conflicting course names for the same code'
      );
    }

    if (!names.has(key)) {
      names.set(key, v.name.toLowerCase());
    }

    if (
      !errors.length &&
      used.some(
        item =>
          item.day === v.day &&
          overlaps(item, v)
      )
    ) {
      errors.push('Class clash');
    }

    if (!errors.length) {
      used.push(v);
    }

    return {
      ...v,
      row: i + 1,
      errors
    };
  });
}

export async function preview(req, res) {
  if (typeof req.body.csv !== 'string') {
    bad('CSV text required');
  }

  let rows;

  try {
    rows = parse(req.body.csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    });
  } catch {
    bad('Invalid CSV format');
  }

  if (rows.length > 500) {
    bad('CSV exceeds 500 rows');
  }

  const existing = await ClassSlot.find({
    owner: req.user.id
  });

  const checked = validateRows(rows, existing);

  res.json({
    rows: checked,
    valid:
      checked.length > 0 &&
      checked.every(row => row.errors.length === 0)
  });
}

export async function importRows(req, res) {
  const rows = req.body.rows;

  if (
    !Array.isArray(rows) ||
    !rows.length ||
    rows.length > 500
  ) {
    bad('Provide 1-500 rows');
  }

  const owner = req.user.id;

  const existing = await ClassSlot.find({ owner });
  const checked = validateRows(rows, existing);

  if (checked.some(row => row.errors.length)) {
    return res.status(400).json({
      message: 'Fix CSV validation errors before import',
      rows: checked
    });
  }

  const codes = [
    ...new Set(
      checked.map(row => row.code.toLowerCase())
    )
  ];

  const courses = await Course.find({ owner });

  const byCode = new Map(
    courses.map(course => [
      course.code.toLowerCase(),
      course
    ])
  );

  for (const code of codes) {
    const row = checked.find(
      item => item.code.toLowerCase() === code
    );

    const existingCourse = byCode.get(code);

    if (
      existingCourse &&
      existingCourse.name.toLowerCase() !==
        row.name.toLowerCase()
    ) {
      bad(
        `Course ${row.code} already exists with a different name`,
        409
      );
    }
  }

  const createdCourses = [];
  const createdSlots = [];

  try {
    for (const code of codes) {
      if (!byCode.has(code)) {
        const row = checked.find(
          item => item.code.toLowerCase() === code
        );

        const course = await Course.create({
          owner,
          code: row.code,
          name: row.name,
          color: '#8974e8'
        });

        byCode.set(code, course);
        createdCourses.push(course._id);
      }
    }

    const slots = checked.map(row => ({
      owner,
      courseId: byCode.get(
        row.code.toLowerCase()
      )._id,
      day: row.day,
      start: row.start,
      end: row.end,
      room: row.room
    }));

    for (const slot of slots) {
      const created = await ClassSlot.create(slot);
      createdSlots.push(created._id);
    }

    res.status(201).json({
      imported: slots.length
    });
  } catch (error) {
    if (createdSlots.length) {
      await ClassSlot.deleteMany({
        _id: { $in: createdSlots },
        owner
      });
    }

    if (createdCourses.length) {
      await Course.deleteMany({
        _id: { $in: createdCourses },
        owner
      });
    }

    throw error;
  }
}
