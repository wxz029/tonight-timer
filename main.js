const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const COMPACT_SIZE = { width: 340, height: 264 };
const SETTINGS_SIZE = { width: 340, height: 620 };
const DEFAULT_SETTINGS = Object.freeze({
  bedTime: '01:00',
  dayMode: 'auto',
  displayUnit: 'hours',
  bufferMinutes: 90,
  alwaysOnTop: true,
  lockPosition: false,
  autoLaunch: false,
  theme: 'dark',
  language: 'zh-CN',
  windowPosition: null,
});

let mainWindow;
let tray;
let settings = { ...DEFAULT_SETTINGS };
let settingsPath;
let isQuitting = false;
let moveSaveTimer;
const capturePath = process.env.WIDGET_CAPTURE_PATH;
const captureMode = process.env.WIDGET_CAPTURE_MODE || 'dashboard';
const captureLanguage = process.env.WIDGET_CAPTURE_LANGUAGE;

function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function sanitizeSettings(candidate = {}) {
  const next = { ...DEFAULT_SETTINGS };

  if (isValidTime(candidate.bedTime)) next.bedTime = candidate.bedTime;
  if (['auto', 'today', 'tomorrow'].includes(candidate.dayMode)) next.dayMode = candidate.dayMode;
  if (['hours', 'minutes'].includes(candidate.displayUnit)) next.displayUnit = candidate.displayUnit;
  if (Number.isFinite(candidate.bufferMinutes)) {
    next.bufferMinutes = Math.min(720, Math.max(0, Math.round(candidate.bufferMinutes)));
  }
  if (typeof candidate.alwaysOnTop === 'boolean') next.alwaysOnTop = candidate.alwaysOnTop;
  if (typeof candidate.lockPosition === 'boolean') next.lockPosition = candidate.lockPosition;
  if (typeof candidate.autoLaunch === 'boolean') next.autoLaunch = candidate.autoLaunch;
  if (['dark', 'light', 'system'].includes(candidate.theme)) next.theme = candidate.theme;
  if (['zh-CN', 'en'].includes(candidate.language)) next.language = candidate.language;
  if (
    candidate.windowPosition &&
    Number.isFinite(candidate.windowPosition.x) &&
    Number.isFinite(candidate.windowPosition.y)
  ) {
    next.windowPosition = {
      x: Math.round(candidate.windowPosition.x),
      y: Math.round(candidate.windowPosition.y),
    };
  }

  return next;
}

function loadSettings() {
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    settings = sanitizeSettings(saved);
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    console.error('Could not save settings:', error);
  }
}

function isPositionVisible(position) {
  if (!position) return false;
  return screen.getAllDisplays().some(({ workArea }) => {
    const right = position.x + COMPACT_SIZE.width;
    const bottom = position.y + COMPACT_SIZE.height;
    return (
      right > workArea.x + 80 &&
      position.x < workArea.x + workArea.width - 80 &&
      bottom > workArea.y + 40 &&
      position.y < workArea.y + workArea.height - 40
    );
  });
}

function getInitialBounds() {
  if (isPositionVisible(settings.windowPosition)) {
    return { ...COMPACT_SIZE, ...settings.windowPosition };
  }

  const { workArea } = screen.getPrimaryDisplay();
  return {
    ...COMPACT_SIZE,
    x: workArea.x + workArea.width - COMPACT_SIZE.width - 24,
    y: workArea.y + 28,
  };
}

function createTrayIcon() {
  const size = 16;
  const bitmap = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const dx = x - 7.5;
      const dy = y - 7.5;
      const inside = dx * dx + dy * dy <= 49;
      const cutout = (x - 10) ** 2 + (y - 5) ** 2 <= 20;
      const visible = inside && !cutout;
      bitmap[index] = visible ? 235 : 0;
      bitmap[index + 1] = visible ? 165 : 0;
      bitmap[index + 2] = visible ? 118 : 0;
      bitmap[index + 3] = visible ? 255 : 0;
    }
  }
  return nativeImage.createFromBitmap(bitmap, { width: size, height: size, scaleFactor: 1 });
}

function updateTrayMenu() {
  if (!tray) return;
  const copy = settings.language === 'en'
    ? { show: 'Show widget', top: 'Always on top', quit: 'Quit', tooltip: 'Tonight Timer' }
    : { show: '显示小组件', top: '始终置顶', quit: '退出', tooltip: '今晚还有多久' };
  tray.setToolTip(copy.tooltip);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: copy.show,
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        },
      },
      {
        label: copy.top,
        type: 'checkbox',
        checked: settings.alwaysOnTop,
        click: (item) => updateSettings({ alwaysOnTop: item.checked }),
      },
      { type: 'separator' },
      {
        label: copy.quit,
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
}

function applyAutoLaunch(enabled) {
  const launchSettings = { openAtLogin: enabled };
  if (!app.isPackaged) {
    launchSettings.path = process.execPath;
    launchSettings.args = [app.getAppPath()];
  }
  app.setLoginItemSettings(launchSettings);
}

function updateSettings(patch) {
  const previousAutoLaunch = settings.autoLaunch;
  settings = sanitizeSettings({ ...settings, ...patch });

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(settings.alwaysOnTop, 'floating');
    mainWindow.webContents.send('settings-changed', settings);
  }

  if (previousAutoLaunch !== settings.autoLaunch) {
    applyAutoLaunch(settings.autoLaunch);
  }

  saveSettings();
  updateTrayMenu();
  return settings;
}

function setWindowExpanded(expanded) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const target = expanded ? SETTINGS_SIZE : COMPACT_SIZE;
  const current = mainWindow.getBounds();
  const display = screen.getDisplayMatching(current);
  let x = current.x;
  let y = current.y;

  if (x + target.width > display.workArea.x + display.workArea.width) {
    x = display.workArea.x + display.workArea.width - target.width;
  }
  if (y + target.height > display.workArea.y + display.workArea.height) {
    y = display.workArea.y + display.workArea.height - target.height;
  }
  x = Math.max(display.workArea.x, x);
  y = Math.max(display.workArea.y, y);

  mainWindow.setBounds({ x, y, ...target }, true);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    ...getInitialBounds(),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    show: false,
    skipTaskbar: true,
    alwaysOnTop: settings.alwaysOnTop,
    hasShadow: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setAlwaysOnTop(settings.alwaysOnTop, 'floating');
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => {
    if (!capturePath) mainWindow.show();
  });

  mainWindow.on('move', () => {
    if (moveSaveTimer) clearTimeout(moveSaveTimer);
    moveSaveTimer = setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const [x, y] = mainWindow.getPosition();
      settings.windowPosition = { x, y };
      saveSettings();
    }, 350);
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  if (capturePath) {
    mainWindow.webContents.once('did-finish-load', async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (captureMode === 'settings' || captureMode === 'settings-bottom') {
        await mainWindow.webContents.executeJavaScript("document.querySelector('#settingsButton').click()");
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      if (captureMode === 'settings-bottom') {
        await mainWindow.webContents.executeJavaScript("document.querySelector('.settings-scroll').scrollTop = document.querySelector('.settings-scroll').scrollHeight");
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      const image = await mainWindow.webContents.capturePage();
      fs.writeFileSync(capturePath, image.toPNG());
      isQuitting = true;
      app.quit();
    });
  }
}

function registerIpc() {
  ipcMain.handle('get-settings', () => ({ ...settings, version: app.getVersion() }));
  ipcMain.handle('update-settings', (_event, patch) => updateSettings(patch));
  ipcMain.on('set-expanded', (_event, expanded) => setWindowExpanded(Boolean(expanded)));
  ipcMain.on('window-action', (_event, action) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (action === 'hide') mainWindow.hide();
    if (action === 'quit') {
      isQuitting = true;
      app.quit();
    }
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('com.wxz.tonighttimer');
    loadSettings();
    if (['zh-CN', 'en'].includes(captureLanguage)) settings.language = captureLanguage;
    registerIpc();
    createWindow();

    tray = new Tray(createTrayIcon());
    tray.on('click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
    updateTrayMenu();
  });
}

app.on('activate', () => {
  if (mainWindow) mainWindow.show();
});

// Intentionally keep the process alive in the tray when the widget is hidden.
app.on('window-all-closed', () => {});

app.on('before-quit', () => {
  isQuitting = true;
});
