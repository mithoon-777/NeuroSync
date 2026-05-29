const { app, BrowserWindow, ipcMain, Tray, Menu, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { uIOhook } = require('uiohook-napi');
const isDev = require('electron-is-dev');

let win;
let tray = null;

const userDataPath = app.getPath('userData');
const txtLogPath = path.join(userDataPath, 'fatigue_logs.txt');
const csvLogPath = path.join(userDataPath, 'fatigue_logs.csv');
const jsonLogPath = path.join(userDataPath, 'fatigue_logs.json');

let activityInterval = null;
let lastActivityTime = Date.now();
let trackingConfig = { startTime: null, endTime: null, isTracking: false };
const inactivityLimit = 15000;
const calculationInterval = 10000;
const fatigueThreshold = 80;

let notificationShown = false;
let isPaused = false;
let overtimeNotificationSent = false;

let metrics = { keyPresses: 0, backspaces: 0, mouseClicks: 0, mouseDistance: 0, lastMousePos: { x: 0, y: 0 } };

function getFormattedTimestamp() {
  const now = new Date();
  const date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  return `${date} ${time}`;
}

function showFatigueNotification() {
  new Notification({
    title: 'High Fatigue Detected!',
    body: 'It might be a good time to take a short break.',
    icon: path.join(__dirname, '..', 'public', 'tray-icon.png')
  }).show();
  notificationShown = true;
}

function showOvertimeNotification() {
  new Notification({
    title: 'Overtime Started',
    body: 'You are now working past your set hours. Remember to take breaks!',
    icon: path.join(__dirname, '..', 'public', 'tray-icon.png')
  }).show();
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }
  win.once('ready-to-show', () => win.show());
  win.on('minimize', (event) => {
    event.preventDefault();
    win.hide();
  });
  win.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
    return false;
  });
  const iconPath = path.join(__dirname, '..', 'public', 'tray-icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('NeuroSync is running...');
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => win.show() },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => win.show());
}

function initializeLogFiles() {
  if (!fs.existsSync(csvLogPath)) {
    fs.writeFileSync(csvLogPath, 'Timestamp,FatigueScore,TypingSpeed,ErrorCount,MouseDistance,Status\n', 'utf8');
  }
  if (!fs.existsSync(jsonLogPath)) {
    fs.writeFileSync(jsonLogPath, '[]', 'utf8');
  }
}

function updateLogFiles(logEntry) {
  if (typeof logEntry === 'string') {
    const statusEntry = `[${getFormattedTimestamp()}] [STATUS] ${logEntry}\n`;
    fs.appendFileSync(txtLogPath, statusEntry, 'utf8');
    return;
  }
  const txtEntry = `[${logEntry.timestamp}] [${logEntry.status}] Score: ${logEntry.fatigueScore}, Speed: ${logEntry.typingSpeed} CPM, Errors: ${logEntry.errorCount}\n`;
  fs.appendFileSync(txtLogPath, txtEntry, 'utf8');
  const csvEntry = `"${logEntry.timestamp}",${logEntry.fatigueScore},${logEntry.typingSpeed},${logEntry.errorCount},${logEntry.mouseDistance},"${logEntry.status}"\n`;
  fs.appendFileSync(csvLogPath, csvEntry, 'utf8');
  try {
    const jsonFile = fs.readFileSync(jsonLogPath, 'utf8');
    const logs = JSON.parse(jsonFile);
    logs.push(logEntry);
    fs.writeFileSync(jsonLogPath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (error) { console.error('Failed to update JSON log:', error); }
}

ipcMain.on('set-time-range', (event, { startTime, endTime }) => {
  // Helper to convert 12-hour AM/PM to 24-hour
  const convertTo24Hour = (hour, period) => {
    hour = parseInt(hour, 10);
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    }
    if (period === 'AM' && hour === 12) { // Midnight case
      hour = 0;
    }
    return hour;
  };

  trackingConfig = {
    startTime: {
      hour: convertTo24Hour(startTime.hour, startTime.period),
      minute: parseInt(startTime.minute, 10)
    },
    endTime: {
      hour: convertTo24Hour(endTime.hour, endTime.period),
      minute: parseInt(endTime.minute, 10)
    },
    isTracking: true
  };
  
  isPaused = false;
  overtimeNotificationSent = false;
  initializeLogFiles();
  startFatigueTracking();
});
ipcMain.on('stop-tracking', () => stopFatigueTracking());
ipcMain.on('pause-tracking', () => {
  isPaused = true;
  updateLogFiles("Tracking Paused");
  console.log('Main: Tracking Paused.');
});
ipcMain.on('resume-tracking', () => {
  isPaused = false;
  updateLogFiles("Tracking Resumed");
  console.log('Main: Tracking Resumed.');
});
ipcMain.handle('get-logs', async () => {
  if (!fs.existsSync(txtLogPath)) return '';
  return fs.readFileSync(txtLogPath, 'utf8');
});
ipcMain.handle('open-logs-folder', () => {
  shell.openPath(userDataPath);
});
ipcMain.handle('get-all-logs', async () => {
  if (!fs.existsSync(jsonLogPath)) {
    return [];
  }
  try {
    const jsonFile = fs.readFileSync(jsonLogPath, 'utf8');
    return JSON.parse(jsonFile);
  } catch (error) {
    console.error('Failed to read or parse all logs:', error);
    return [];
  }
});

function startFatigueTracking() {
  console.log('Main: Starting fatigue tracking...');
  if (activityInterval) clearInterval(activityInterval);
  activityInterval = setInterval(() => {
    if (isPaused) return;

    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const startTotalMinutes = trackingConfig.startTime.hour * 60 + trackingConfig.startTime.minute;
    const endTotalMinutes = trackingConfig.endTime.hour * 60 + trackingConfig.endTime.minute;
    const isWithinWindow = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
    const isOvertime = currentTotalMinutes > endTotalMinutes;

    if (!trackingConfig.isTracking || (!isWithinWindow && !isOvertime)) {
      return;
    }
    if (isOvertime && !overtimeNotificationSent) {
      showOvertimeNotification();
      overtimeNotificationSent = true;
    }
    const typingSpeed = Math.round(metrics.keyPresses * (60000 / calculationInterval));
    let score = 0;
    if (typingSpeed < 150 && typingSpeed > 10) score += 20;
    if ((metrics.keyPresses > 0 ? metrics.backspaces / metrics.keyPresses : 0) > 0.1) score += 30;
    if (metrics.mouseDistance < 1000) score += 20;
    if (Date.now() - lastActivityTime > inactivityLimit) score = 100;
    if (isOvertime) { score *= 1.25; }
    score = Math.min(Math.round(score), 100);
    if (score >= fatigueThreshold && !notificationShown) { showFatigueNotification(); }
    const currentData = { typingSpeed, errorCount: metrics.backspaces, mouseDistance: metrics.mouseDistance, fatigueScore: score };
    win.webContents.send('update-data', currentData);
    const logEntry = {
      timestamp: getFormattedTimestamp(),
      fatigueScore: score,
      typingSpeed,
      errorCount: metrics.backspaces,
      mouseDistance: metrics.mouseDistance,
      status: isOvertime ? 'Overtime' : 'Work Hours'
    };
    updateLogFiles(logEntry);
    metrics = { keyPresses: 0, backspaces: 0, mouseClicks: 0, mouseDistance: 0, lastMousePos: metrics.lastMousePos };
  }, calculationInterval);
}

function stopFatigueTracking() {
  console.log('Main: Stopping fatigue tracking...');
  if (activityInterval) {
    clearInterval(activityInterval);
    activityInterval = null;
  }
  trackingConfig.isTracking = false;
  overtimeNotificationSent = false;
}

app.whenReady().then(createWindow);

function resetNotificationFlag() {
  notificationShown = false;
  win.webContents.send('activity-resumed');
}
uIOhook.on('keydown', (e) => {
  lastActivityTime = Date.now();
  metrics.keyPresses++;
  if (e.keycode === 8) {
    metrics.backspaces++;
  }
  resetNotificationFlag();
});
uIOhook.on('click', (e) => {
  lastActivityTime = Date.now();
  metrics.mouseClicks++;
  resetNotificationFlag();
});
uIOhook.on('move', (e) => {
  lastActivityTime = Date.now();
  metrics.mouseDistance += Math.abs(e.x - metrics.lastMousePos.x) + Math.abs(e.y - metrics.lastMousePos.y);
  metrics.lastMousePos = { x: e.x, y: e.y };
  resetNotificationFlag();
});
uIOhook.start();
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => {
  uIOhook.stop();
});