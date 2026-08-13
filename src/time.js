(function attachTimeTools(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TimeTools = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createTimeTools() {
  const MINUTE_MS = 60 * 1000;
  const HOUR_MS = 60 * MINUTE_MS;

  function parseTime(timeString) {
    if (typeof timeString !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeString)) {
      throw new TypeError('Time must use the HH:mm format.');
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  function getSleepTarget(now, timeString, dayMode = 'auto') {
    const { hours, minutes } = parseTime(timeString);
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);

    if (dayMode === 'tomorrow') {
      target.setDate(target.getDate() + 1);
    } else if (dayMode === 'auto' && target.getTime() < now.getTime()) {
      target.setDate(target.getDate() + 1);
    } else if (!['auto', 'today'].includes(dayMode)) {
      throw new TypeError('Unknown day mode.');
    }

    return target;
  }

  function calculateTimes(now, target, bufferMinutes = 90) {
    const remainingMs = Math.max(0, target.getTime() - now.getTime());
    const studyMs = Math.max(0, remainingMs - Math.max(0, bufferMinutes) * MINUTE_MS);
    return { remainingMs, studyMs };
  }

  function formatDuration(milliseconds, unit = 'hours') {
    const safeMs = Math.max(0, milliseconds);
    if (safeMs === 0) return '0';
    if (unit === 'minutes') return String(Math.ceil(safeMs / MINUTE_MS));
    if (unit !== 'hours') throw new TypeError('Unknown duration unit.');
    return Math.max(0.1, safeMs / HOUR_MS).toFixed(1);
  }

  function getDayLabel(now, target, language = 'zh-CN') {
    const today = new Date(now);
    const targetDay = new Date(target);
    today.setHours(0, 0, 0, 0);
    targetDay.setHours(0, 0, 0, 0);
    const calendarDays = Math.round((targetDay.getTime() - today.getTime()) / (24 * HOUR_MS));
    if (language === 'en') {
      if (calendarDays <= 0) return 'Today';
      if (calendarDays === 1) return 'Tomorrow';
      return `In ${calendarDays} days`;
    }
    if (calendarDays <= 0) return '今天';
    if (calendarDays === 1) return '次日';
    return `${calendarDays}天后`;
  }

  function getWidgetStatus(remainingMs, studyMs) {
    if (remainingMs <= 0) return 'bedtime';
    if (remainingMs <= 30 * MINUTE_MS) return 'sleep-soon';
    if (studyMs <= 0) return 'study-done';
    return 'active';
  }

  return {
    MINUTE_MS,
    HOUR_MS,
    parseTime,
    getSleepTarget,
    calculateTimes,
    formatDuration,
    getDayLabel,
    getWidgetStatus,
  };
});
