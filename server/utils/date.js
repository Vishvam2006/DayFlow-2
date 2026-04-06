const roundToNumber = (value) => Math.round(value * 100) / 100;

const toDateKey = (input = new Date()) => {
  const date = new Date(input);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
};

const getMonthRange = (month) => {
  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth();

  if (month) {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) {
      throw new Error("Month must be in YYYY-MM format.");
    }

    year = Number(match[1]);
    monthIndex = Number(match[2]) - 1;

    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error("Month must be between 01 and 12.");
    }
  }

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);

  return {
    year,
    monthIndex,
    month: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    start,
    end,
  };
};

const listDateKeysInRange = (startInput, endInput, options = {}) => {
  const { weekdaysOnly = false } = options;
  const start = new Date(startInput);
  const end = new Date(endInput);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const dates = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const day = cursor.getDay();
    if (weekdaysOnly && (day === 0 || day === 6)) {
      continue;
    }
    dates.push(toDateKey(cursor));
  }

  return dates;
};

const getMonthDateKeys = (month, options = {}) => {
  const { start, end } = getMonthRange(month);
  return listDateKeysInRange(start, end, options);
};

const formatMonthLabel = (month) => {
  const { start } = getMonthRange(month);
  return start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export {
  formatMonthLabel,
  getMonthDateKeys,
  getMonthRange,
  listDateKeysInRange,
  roundToNumber,
  toDateKey,
};
