const previewSettings = {
  bedTime: '01:00',
  dayMode: 'auto',
  displayUnit: 'hours',
  bufferMinutes: 90,
  alwaysOnTop: true,
  lockPosition: false,
  autoLaunch: false,
  theme: 'dark',
  language: 'zh-CN',
  version: '1.1.0',
};

const api = window.desktopWidget || {
  getSettings: async () => ({ ...previewSettings }),
  updateSettings: async (patch) => Object.assign(previewSettings, patch),
  setExpanded: () => {},
  windowAction: () => {},
  onSettingsChanged: () => () => {},
};

const {
  HOUR_MS,
  getSleepTarget,
  calculateTimes,
  formatDuration,
  getDayLabel,
  getWidgetStatus,
} = window.TimeTools;

const translations = {
  'zh-CN': {
    appTitle: '今晚还有多久',
    sleepLabel: '距离睡觉',
    studyLabel: '还可以学习',
    settingsTooltip: '设置',
    settingsAria: '打开设置',
    hideTooltip: '隐藏到托盘',
    hideAria: '隐藏到托盘',
    backAria: '返回',
    bedtimePrefix: '睡觉时间',
    active: '保持节奏，今晚也会很充实。',
    studyDone: '今天的学习时间结束了，开始放松吧。',
    sleepSoon: '快到睡觉时间了，准备收尾吧。',
    bedtime: '该睡觉了，晚安。',
    settingsTitle: '设置',
    settingsSubtitle: '修改后自动保存',
    sleepPlanHeading: '睡觉计划',
    bedTimeSettingLabel: '睡觉时间',
    dayModeSettingLabel: '日期归属',
    dayModeAuto: '自动判断',
    dayModeToday: '今天',
    dayModeTomorrow: '次日',
    displayUnitSettingLabel: '显示单位',
    hours: '小时',
    minutes: '分钟',
    bufferSettingLabel: '睡前预留时间',
    desktopBehaviorHeading: '桌面行为',
    alwaysOnTopLabel: '始终置顶',
    alwaysOnTopDescription: '让小组件显示在其他窗口上方',
    lockPositionLabel: '锁定位置',
    lockPositionDescription: '防止不小心拖动小组件',
    autoLaunchLabel: '开机自动启动',
    autoLaunchDescription: '登录 Windows 后自动显示',
    appearanceHeading: '外观',
    themeSettingLabel: '主题',
    themeDark: '深色',
    themeLight: '浅色',
    themeSystem: '跟随系统',
    languageSettingLabel: '语言',
    languageChinese: '中文',
    languageEnglish: 'English',
    quit: '退出程序',
    saved: '已保存',
    versionName: '今晚还有多久',
  },
  en: {
    appTitle: 'Tonight Timer',
    sleepLabel: 'Time to bed',
    studyLabel: 'Study time left',
    settingsTooltip: 'Settings',
    settingsAria: 'Open settings',
    hideTooltip: 'Hide to tray',
    hideAria: 'Hide to tray',
    backAria: 'Back',
    bedtimePrefix: 'Bedtime',
    active: 'Stay focused. Make tonight count.',
    studyDone: 'Study time is over. Time to wind down.',
    sleepSoon: 'Bedtime is close. Start wrapping up.',
    bedtime: 'Time for bed. Good night.',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Changes save automatically',
    sleepPlanHeading: 'Bedtime plan',
    bedTimeSettingLabel: 'Bedtime',
    dayModeSettingLabel: 'Day',
    dayModeAuto: 'Auto',
    dayModeToday: 'Today',
    dayModeTomorrow: 'Tomorrow',
    displayUnitSettingLabel: 'Display unit',
    hours: 'Hours',
    minutes: 'Minutes',
    bufferSettingLabel: 'Wind-down time',
    desktopBehaviorHeading: 'Desktop behavior',
    alwaysOnTopLabel: 'Always on top',
    alwaysOnTopDescription: 'Keep the widget above other windows',
    lockPositionLabel: 'Lock position',
    lockPositionDescription: 'Prevent accidental dragging',
    autoLaunchLabel: 'Start with Windows',
    autoLaunchDescription: 'Show automatically after sign-in',
    appearanceHeading: 'Appearance',
    themeSettingLabel: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeSystem: 'System',
    languageSettingLabel: 'Language',
    languageChinese: 'Chinese',
    languageEnglish: 'English',
    quit: 'Quit app',
    saved: 'Saved',
    versionName: 'Tonight Timer',
  },
};

const elements = {
  app: document.querySelector('#app'),
  dashboard: document.querySelector('#dashboard'),
  settingsPanel: document.querySelector('#settingsPanel'),
  dragRegions: document.querySelectorAll('.drag-region'),
  settingsButton: document.querySelector('#settingsButton'),
  hideButton: document.querySelector('#hideButton'),
  backButton: document.querySelector('#backButton'),
  quitButton: document.querySelector('#quitButton'),
  brandLabel: document.querySelector('#brandLabel'),
  sleepLabel: document.querySelector('#sleepLabel'),
  studyLabel: document.querySelector('#studyLabel'),
  sleepValue: document.querySelector('#sleepValue'),
  studyValue: document.querySelector('#studyValue'),
  sleepUnit: document.querySelector('#sleepUnit'),
  studyUnit: document.querySelector('#studyUnit'),
  studyCard: document.querySelector('#studyCard'),
  bedtimeLabel: document.querySelector('#bedtimeLabel'),
  currentTime: document.querySelector('#currentTime'),
  statusMessage: document.querySelector('#statusMessage'),
  settingsTitle: document.querySelector('#settingsTitle'),
  settingsSubtitle: document.querySelector('#settingsSubtitle'),
  sleepPlanHeading: document.querySelector('#sleepPlanHeading'),
  bedTimeSettingLabel: document.querySelector('#bedTimeSettingLabel'),
  dayModeSettingLabel: document.querySelector('#dayModeSettingLabel'),
  dayModeAutoOption: document.querySelector('#dayModeAutoOption'),
  dayModeTodayOption: document.querySelector('#dayModeTodayOption'),
  dayModeTomorrowOption: document.querySelector('#dayModeTomorrowOption'),
  displayUnitSettingLabel: document.querySelector('#displayUnitSettingLabel'),
  bufferSettingLabel: document.querySelector('#bufferSettingLabel'),
  bufferHoursLabel: document.querySelector('#bufferHoursLabel'),
  bufferMinutesLabel: document.querySelector('#bufferMinutesLabel'),
  desktopBehaviorHeading: document.querySelector('#desktopBehaviorHeading'),
  alwaysOnTopLabel: document.querySelector('#alwaysOnTopLabel'),
  alwaysOnTopDescription: document.querySelector('#alwaysOnTopDescription'),
  lockPositionLabel: document.querySelector('#lockPositionLabel'),
  lockPositionDescription: document.querySelector('#lockPositionDescription'),
  autoLaunchLabel: document.querySelector('#autoLaunchLabel'),
  autoLaunchDescription: document.querySelector('#autoLaunchDescription'),
  appearanceHeading: document.querySelector('#appearanceHeading'),
  themeSettingLabel: document.querySelector('#themeSettingLabel'),
  themeDarkOption: document.querySelector('#themeDarkOption'),
  themeLightOption: document.querySelector('#themeLightOption'),
  themeSystemOption: document.querySelector('#themeSystemOption'),
  languageSettingLabel: document.querySelector('#languageSettingLabel'),
  languageChineseOption: document.querySelector('#languageChineseOption'),
  languageEnglishOption: document.querySelector('#languageEnglishOption'),
  bedTimeInput: document.querySelector('#bedTimeInput'),
  dayModeInput: document.querySelector('#dayModeInput'),
  hoursUnitButton: document.querySelector('#hoursUnitButton'),
  minutesUnitButton: document.querySelector('#minutesUnitButton'),
  bufferHoursInput: document.querySelector('#bufferHoursInput'),
  bufferMinutesInput: document.querySelector('#bufferMinutesInput'),
  alwaysOnTopInput: document.querySelector('#alwaysOnTopInput'),
  lockPositionInput: document.querySelector('#lockPositionInput'),
  autoLaunchInput: document.querySelector('#autoLaunchInput'),
  themeInput: document.querySelector('#themeInput'),
  languageInput: document.querySelector('#languageInput'),
  versionLabel: document.querySelector('#versionLabel'),
  saveToast: document.querySelector('#saveToast'),
};

let settings;
let activeTarget;
let toastTimer;

function copy() {
  return translations[settings.language] || translations['zh-CN'];
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function applyLanguage() {
  const t = copy();
  document.documentElement.lang = settings.language;
  document.title = t.appTitle;
  setText(elements.brandLabel, t.appTitle);
  setText(elements.sleepLabel, t.sleepLabel);
  setText(elements.studyLabel, t.studyLabel);
  elements.settingsButton.title = t.settingsTooltip;
  elements.settingsButton.setAttribute('aria-label', t.settingsAria);
  elements.hideButton.title = t.hideTooltip;
  elements.hideButton.setAttribute('aria-label', t.hideAria);
  elements.backButton.setAttribute('aria-label', t.backAria);
  setText(elements.settingsTitle, t.settingsTitle);
  setText(elements.settingsSubtitle, t.settingsSubtitle);
  setText(elements.sleepPlanHeading, t.sleepPlanHeading);
  setText(elements.bedTimeSettingLabel, t.bedTimeSettingLabel);
  setText(elements.dayModeSettingLabel, t.dayModeSettingLabel);
  setText(elements.dayModeAutoOption, t.dayModeAuto);
  setText(elements.dayModeTodayOption, t.dayModeToday);
  setText(elements.dayModeTomorrowOption, t.dayModeTomorrow);
  setText(elements.displayUnitSettingLabel, t.displayUnitSettingLabel);
  setText(elements.hoursUnitButton, t.hours);
  setText(elements.minutesUnitButton, t.minutes);
  setText(elements.bufferSettingLabel, t.bufferSettingLabel);
  setText(elements.bufferHoursLabel, t.hours.toLowerCase());
  setText(elements.bufferMinutesLabel, t.minutes.toLowerCase());
  setText(elements.desktopBehaviorHeading, t.desktopBehaviorHeading);
  setText(elements.alwaysOnTopLabel, t.alwaysOnTopLabel);
  setText(elements.alwaysOnTopDescription, t.alwaysOnTopDescription);
  setText(elements.lockPositionLabel, t.lockPositionLabel);
  setText(elements.lockPositionDescription, t.lockPositionDescription);
  setText(elements.autoLaunchLabel, t.autoLaunchLabel);
  setText(elements.autoLaunchDescription, t.autoLaunchDescription);
  setText(elements.appearanceHeading, t.appearanceHeading);
  setText(elements.themeSettingLabel, t.themeSettingLabel);
  setText(elements.themeDarkOption, t.themeDark);
  setText(elements.themeLightOption, t.themeLight);
  setText(elements.themeSystemOption, t.themeSystem);
  setText(elements.languageSettingLabel, t.languageSettingLabel);
  setText(elements.languageChineseOption, t.languageChinese);
  setText(elements.languageEnglishOption, t.languageEnglish);
  setText(elements.quitButton, t.quit);
  setText(elements.saveToast, t.saved);
  setText(elements.versionLabel, `${t.versionName} · v${settings.version || '1.1.0'}`);
}

function applyTheme(theme) {
  elements.app.dataset.theme = theme;
}

function applyLockState(locked) {
  elements.dragRegions.forEach((region) => region.classList.toggle('locked', locked));
}

function syncForm() {
  elements.bedTimeInput.value = settings.bedTime;
  elements.dayModeInput.value = settings.dayMode;
  elements.hoursUnitButton.classList.toggle('active', settings.displayUnit === 'hours');
  elements.minutesUnitButton.classList.toggle('active', settings.displayUnit === 'minutes');
  elements.bufferHoursInput.value = Math.floor(settings.bufferMinutes / 60);
  elements.bufferMinutesInput.value = String(settings.bufferMinutes % 60);
  elements.alwaysOnTopInput.checked = settings.alwaysOnTop;
  elements.lockPositionInput.checked = settings.lockPosition;
  elements.autoLaunchInput.checked = settings.autoLaunch;
  elements.themeInput.value = settings.theme;
  elements.languageInput.value = settings.language;
  applyTheme(settings.theme);
  applyLockState(settings.lockPosition);
  applyLanguage();
}

function resetTarget() {
  activeTarget = getSleepTarget(new Date(), settings.bedTime, settings.dayMode);
}

function showSaveToast() {
  clearTimeout(toastTimer);
  elements.saveToast.classList.add('show');
  toastTimer = setTimeout(() => elements.saveToast.classList.remove('show'), 1100);
}

async function savePatch(patch, options = {}) {
  const oldTime = settings.bedTime;
  const oldDayMode = settings.dayMode;
  settings = { ...settings, ...patch };
  settings = { ...settings, ...(await api.updateSettings(patch)) };
  if (oldTime !== settings.bedTime || oldDayMode !== settings.dayMode || options.resetTarget) {
    resetTarget();
  }
  syncForm();
  updateClock();
  showSaveToast();
}

function unitText() {
  return settings.displayUnit === 'hours' ? 'h' : 'min';
}

function updateClock() {
  if (!settings) return;
  const now = new Date();
  if (!activeTarget) resetTarget();

  // Keep the completed state visible for six hours, then prepare the next automatic cycle.
  if (settings.dayMode === 'auto' && now.getTime() - activeTarget.getTime() > 6 * HOUR_MS) {
    resetTarget();
  }

  const { remainingMs, studyMs } = calculateTimes(now, activeTarget, settings.bufferMinutes);
  const status = getWidgetStatus(remainingMs, studyMs);
  const unit = unitText();
  const t = copy();

  elements.sleepValue.textContent = formatDuration(remainingMs, settings.displayUnit);
  elements.studyValue.textContent = formatDuration(studyMs, settings.displayUnit);
  elements.sleepUnit.textContent = unit;
  elements.studyUnit.textContent = unit;
  elements.bedtimeLabel.textContent = `${t.bedtimePrefix}: ${getDayLabel(now, activeTarget, settings.language)} ${settings.bedTime}`;
  elements.currentTime.textContent = now.toLocaleTimeString(settings.language === 'en' ? 'en-GB' : 'zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  elements.studyCard.classList.toggle('warning', studyMs > 0 && studyMs <= 30 * 60 * 1000);
  elements.studyCard.classList.toggle('done', studyMs <= 0);
  elements.statusMessage.className = 'status-message';

  const messages = {
    active: t.active,
    'study-done': t.studyDone,
    'sleep-soon': t.sleepSoon,
    bedtime: t.bedtime,
  };
  elements.statusMessage.textContent = messages[status];
  if (status === 'sleep-soon' || status === 'study-done') elements.statusMessage.classList.add('warning');
  if (status === 'bedtime') elements.statusMessage.classList.add('danger');
}

function openSettings() {
  elements.dashboard.hidden = true;
  elements.settingsPanel.hidden = false;
  api.setExpanded(true);
}

function closeSettings() {
  elements.settingsPanel.hidden = true;
  elements.dashboard.hidden = false;
  api.setExpanded(false);
}

function bufferFromForm() {
  const hours = Math.min(12, Math.max(0, Number(elements.bufferHoursInput.value) || 0));
  const minutes = Number(elements.bufferMinutesInput.value) || 0;
  return hours * 60 + minutes;
}

function bindEvents() {
  elements.settingsButton.addEventListener('click', openSettings);
  elements.backButton.addEventListener('click', closeSettings);
  elements.hideButton.addEventListener('click', () => api.windowAction('hide'));
  elements.quitButton.addEventListener('click', () => api.windowAction('quit'));

  elements.bedTimeInput.addEventListener('change', () => savePatch({ bedTime: elements.bedTimeInput.value }, { resetTarget: true }));
  elements.dayModeInput.addEventListener('change', () => savePatch({ dayMode: elements.dayModeInput.value }, { resetTarget: true }));
  elements.hoursUnitButton.addEventListener('click', () => savePatch({ displayUnit: 'hours' }));
  elements.minutesUnitButton.addEventListener('click', () => savePatch({ displayUnit: 'minutes' }));
  elements.bufferHoursInput.addEventListener('change', () => savePatch({ bufferMinutes: bufferFromForm() }));
  elements.bufferMinutesInput.addEventListener('change', () => savePatch({ bufferMinutes: bufferFromForm() }));
  elements.alwaysOnTopInput.addEventListener('change', () => savePatch({ alwaysOnTop: elements.alwaysOnTopInput.checked }));
  elements.lockPositionInput.addEventListener('change', () => savePatch({ lockPosition: elements.lockPositionInput.checked }));
  elements.autoLaunchInput.addEventListener('change', () => savePatch({ autoLaunch: elements.autoLaunchInput.checked }));
  elements.themeInput.addEventListener('change', () => savePatch({ theme: elements.themeInput.value }));
  elements.languageInput.addEventListener('change', () => savePatch({ language: elements.languageInput.value }));
}

async function initialize() {
  settings = await api.getSettings();
  syncForm();
  resetTarget();
  bindEvents();
  updateClock();
  setInterval(updateClock, 1000);
  api.onSettingsChanged((nextSettings) => {
    settings = { ...settings, ...nextSettings };
    syncForm();
    updateClock();
  });
}

initialize();
