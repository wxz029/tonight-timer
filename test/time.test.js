const test = require('node:test');
const assert = require('node:assert/strict');
const {
  HOUR_MS,
  MINUTE_MS,
  parseTime,
  getSleepTarget,
  calculateTimes,
  formatDuration,
  getDayLabel,
  getWidgetStatus,
} = require('../src/time.js');

function localDate(year, month, day, hours, minutes) {
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

test('parses a valid 24-hour time', () => {
  assert.deepEqual(parseTime('01:30'), { hours: 1, minutes: 30 });
  assert.throws(() => parseTime('25:00'));
});

test('auto mode treats an earlier clock time as the next day', () => {
  const now = localDate(2026, 8, 13, 22, 0);
  const target = getSleepTarget(now, '01:00', 'auto');
  assert.equal(target.getDate(), 14);
  assert.equal(target.getTime() - now.getTime(), 3 * HOUR_MS);
  assert.equal(getDayLabel(now, target), '次日');
  assert.equal(getDayLabel(now, target, 'en'), 'Tomorrow');
});

test('23:30 to next-day 01:00 is 1.5 hours', () => {
  const now = localDate(2026, 8, 13, 23, 30);
  const target = getSleepTarget(now, '01:00', 'auto');
  assert.equal(target.getTime() - now.getTime(), 1.5 * HOUR_MS);
});

test('20:00 to 23:00 is three hours on the same day', () => {
  const now = localDate(2026, 8, 13, 20, 0);
  const target = getSleepTarget(now, '23:00', 'auto');
  assert.equal(target.getTime() - now.getTime(), 3 * HOUR_MS);
  assert.equal(getDayLabel(now, target), '今天');
});

test('study time subtracts the default 1.5-hour buffer', () => {
  const now = localDate(2026, 8, 13, 18, 0);
  const target = new Date(now.getTime() + 5.6 * HOUR_MS);
  const result = calculateTimes(now, target, 90);
  assert.equal(formatDuration(result.remainingMs, 'hours'), '5.6');
  assert.equal(formatDuration(result.studyMs, 'hours'), '4.1');
});

test('study time never becomes negative', () => {
  const now = localDate(2026, 8, 13, 22, 0);
  const target = new Date(now.getTime() + HOUR_MS);
  const result = calculateTimes(now, target, 90);
  assert.equal(result.studyMs, 0);
  assert.equal(formatDuration(result.studyMs, 'hours'), '0');
  assert.equal(getWidgetStatus(result.remainingMs, result.studyMs), 'study-done');
});

test('minute mode rounds remaining partial minutes upward', () => {
  assert.equal(formatDuration(30 * MINUTE_MS, 'minutes'), '30');
  assert.equal(formatDuration(30 * MINUTE_MS + 1000, 'minutes'), '31');
});

test('today mode can reach bedtime instead of rolling forward', () => {
  const now = localDate(2026, 8, 13, 23, 0);
  const target = getSleepTarget(now, '22:00', 'today');
  const result = calculateTimes(now, target, 90);
  assert.equal(result.remainingMs, 0);
  assert.equal(getWidgetStatus(result.remainingMs, result.studyMs), 'bedtime');
});
