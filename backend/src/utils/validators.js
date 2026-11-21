export const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const isTime = v => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v+'T12:00:00Z'));
export const overlaps = (a,b) => a.start < b.end && a.end > b.start;
export function assertFields(obj, fields) { for (const field of fields) if (obj[field] === undefined || obj[field] === null || obj[field] === '') { const e = new Error(`${field} is required`); e.status=400; throw e; } }
export function assertTimeRange(start,end) { if(!isTime(start)||!isTime(end)||start>=end) {const e=new Error('Invalid time range');e.status=400;throw e;} }
export function bad(message,status=400) {const e=new Error(message);e.status=status;throw e;}
