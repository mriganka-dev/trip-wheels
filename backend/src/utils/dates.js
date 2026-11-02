export const isDateOverlap = (startA, endA, startB, endB) => {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart < bEnd && aEnd > bStart;
};

export const addMinutes = (date, minutes) => {
  return new Date(new Date(date).getTime() + minutes * 60 * 1000);
};

export const addHours = (date, hours) => {
  return new Date(new Date(date).getTime() + hours * 60 * 60 * 1000);
};

export const addDays = (date, days) => {
  return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
};

export const getHoursDifference = (from, to) => {
  const diffMs = new Date(to).getTime() - new Date(from).getTime();
  return diffMs / (1000 * 60 * 60);
};

