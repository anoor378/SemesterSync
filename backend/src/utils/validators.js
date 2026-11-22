
export const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const isTime = (value) => {
  return (
    typeof value === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
};

export const isDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const overlaps = (first, second) => {
  if (!first || !second) {
    return false;
  }

  return (
    first.start < second.end &&
    first.end > second.start
  );
};

export function bad(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function assertFields(object, fields) {
  if (
    !object ||
    typeof object !== "object" ||
    Array.isArray(object)
  ) {
    bad("Request body must be a valid object");
  }

  for (const field of fields) {
    const value = object[field];

    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim())
    ) {
      bad(`${field} is required`);
    }
  }
}

export function assertTimeRange(start, end) {
  if (!isTime(start) || !isTime(end)) {
    bad("Time must use HH:MM format");
  }

  if (start >= end) {
    bad("End time must be later than start time");
  }
}
