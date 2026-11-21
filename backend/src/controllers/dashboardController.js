
import {
  Course,
  ClassSlot,
  ClassException,
  MakeupClass,
  Deadline,
  Attendance
} from '../models/index.js';

import { toClient } from '../services/dataService.js';

const pad = number =>
  String(number).padStart(2, '0');

export async function dashboard(req, res) {
  const owner = req.user.id;

  const [
    courses,
    slots,
    exceptions,
    makeupClasses,
    deadlines,
    attendance
  ] = await Promise.all([
    Course.find({ owner }),
    ClassSlot.find({ owner }),
    ClassException.find({ owner }),
    MakeupClass.find({ owner }),
    Deadline.find({ owner }),
    Attendance.find({ owner })
  ]);

  const now = new Date();

  const today = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('-');

  const currentTime = [
    pad(now.getHours()),
    pad(now.getMinutes())
  ].join(':');

  const weekday = now.toLocaleDateString('en-US', {
    weekday: 'long'
  });

  const cancelledSlotIds = new Set(
    exceptions
      .filter(item => item.date === today)
      .map(item => String(item.slotId))
  );

  const weeklyClasses = slots
    .filter(slot =>
      slot.day === weekday &&
      !cancelledSlotIds.has(String(slot._id))
    )
    .map(toClient);

  const todaysMakeupClasses = makeupClasses
    .filter(item => item.date === today)
    .map(toClient);

  const todaysClasses = [
    ...weeklyClasses,
    ...todaysMakeupClasses
  ].sort((a, b) =>
    String(a.start).localeCompare(String(b.start))
  );

  const pendingDeadlines = deadlines.filter(
    deadline => !deadline.completed
  );

  const currentDateTime = `${today}T${currentTime}`;

  const upcomingDeadlines = pendingDeadlines
    .filter(deadline => {
      const due = `${deadline.dueDate}T${deadline.dueTime}`;

      return due >= currentDateTime;
    })
    .sort((a, b) => {
      const first = `${a.dueDate}T${a.dueTime}`;
      const second = `${b.dueDate}T${b.dueTime}`;

      return first.localeCompare(second);
    })
    .map(toClient);

  const overdueDeadlines = pendingDeadlines
    .filter(deadline => {
      const due = `${deadline.dueDate}T${deadline.dueTime}`;

      return due < currentDateTime;
    })
    .sort((a, b) => {
      const first = `${a.dueDate}T${a.dueTime}`;
      const second = `${b.dueDate}T${b.dueTime}`;

      return first.localeCompare(second);
    })
    .map(toClient);

  const attendanceStats = courses.map(course => {
    const records = attendance.filter(record =>
      String(record.courseId) === String(course._id)
    );

    const present = records.filter(
      record => record.status === 'Present'
    ).length;

    const recorded = records.length;

    const percentage = recorded
      ? Math.round((present / recorded) * 100)
      : 0;

    return {
      courseId: String(course._id),
      present,
      recorded,
      percentage
    };
  });

  res.json({
    todaysClasses,
    upcomingDeadlines,
    overdueDeadlines,
    attendance: attendanceStats
  });
}
