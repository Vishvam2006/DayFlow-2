export type AttendanceIntent =
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'TODAY_STATUS'
  | 'MONTHLY_SUMMARY'
  | 'UNKNOWN';

export type AttendanceIntentResult = {
  intent: AttendanceIntent;
  confidence: number;
  month?: string;
};

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const scorePatterns = (text: string, patterns: RegExp[]) =>
  patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);

const detectMonth = (normalizedText: string) => {
  const isoMonthMatch = normalizedText.match(/\b(20\d{2})-(0[1-9]|1[0-2])\b/);
  if (isoMonthMatch) {
    return `${isoMonthMatch[1]}-${isoMonthMatch[2]}`;
  }

  const currentDate = new Date();
  const explicitYearMatch = normalizedText.match(/\b(20\d{2})\b/);
  const year = explicitYearMatch ? Number(explicitYearMatch[1]) : currentDate.getFullYear();

  for (const [index, monthName] of MONTH_NAMES.entries()) {
    if (normalizedText.includes(monthName)) {
      return `${year}-${String(index + 1).padStart(2, '0')}`;
    }
  }

  if (/\b(this month|monthly|month summary|attendance summary)\b/.test(normalizedText)) {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  }

  return undefined;
};

export function detectAttendanceIntent(message: string): AttendanceIntentResult {
  const normalizedText = normalizeText(message);

  if (!normalizedText) {
    return { intent: 'UNKNOWN', confidence: 0 };
  }

  const month = detectMonth(normalizedText);

  const scores = {
    CHECK_IN:
      scorePatterns(normalizedText, [
        /\bcheck in\b/,
        /\bclock in\b/,
        /\bmark attendance\b/,
        /\bi (am|have) reached\b/,
        /\breached office\b/,
        /\bstart(ing)? work\b/,
        /\barrived\b/,
        /\bin office\b/,
      ]) + (/\b(today|now|office)\b/.test(normalizedText) ? 0.5 : 0),
    CHECK_OUT:
      scorePatterns(normalizedText, [
        /\bcheck out\b/,
        /\bclock out\b/,
        /\bdone for today\b/,
        /\bleaving office\b/,
        /\bend(ing)? work\b/,
        /\bwrap(ping)? up\b/,
        /\blog ?out for today\b/,
      ]) + (/\b(today|now|home)\b/.test(normalizedText) ? 0.5 : 0),
    TODAY_STATUS:
      scorePatterns(normalizedText, [
        /\battendance status\b/,
        /\btoday s attendance\b/,
        /\btoday attendance\b/,
        /\bam i checked in\b/,
        /\bdid i check in\b/,
        /\bmy attendance\b/,
        /\bworking today\b/,
      ]) + (/\b(status|today)\b/.test(normalizedText) ? 0.5 : 0),
    MONTHLY_SUMMARY:
      scorePatterns(normalizedText, [
        /\bmonthly summary\b/,
        /\battendance summary\b/,
        /\bmonthly attendance\b/,
        /\bthis month\b/,
        /\bmonth summary\b/,
        /\battendance for\b/,
      ]) + (month ? 1 : 0),
  };

  const ranked = Object.entries(scores)
    .sort((left, right) => right[1] - left[1]);

  const [topIntent, topScore] = ranked[0] as [AttendanceIntent, number];
  const secondScore = ranked[1]?.[1] ?? 0;

  if (topScore < 1 || topScore - secondScore < 0.5) {
    return { intent: 'UNKNOWN', confidence: topScore };
  }

  return {
    intent: topIntent,
    confidence: topScore,
    month,
  };
}
