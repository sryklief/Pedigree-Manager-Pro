const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const { initDatabase } = require('./database');
const { LicenseManager } = require('./license');

let mainWindow;
let licenseManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Check license on startup
    checkLicenseStatus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

async function checkLicenseStatus() {
  try {
    const isActivated = await licenseManager.isActivated();
    if (!isActivated) {
      mainWindow.webContents.send('show-license-prompt');
    }
  } catch (error) {
    console.error('License check failed:', error);
    mainWindow.webContents.send('show-license-prompt');
  }
}

app.whenReady().then(async () => {
  // Initialize database
  await initDatabase();
  
  // Initialize license manager
  licenseManager = new LicenseManager();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for license management
ipcMain.handle('validate-license', async (event, licenseKey) => {
  try {
    const result = await licenseManager.validateLicense(licenseKey);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-license-status', async () => {
  try {
    return await licenseManager.getLicenseStatus();
  } catch (error) {
    return { activated: false, error: error.message };
  }
});

// IPC handlers for database operations
ipcMain.handle('db-query', async (event, query, params) => {
  try {
    const db = require('./database').getDatabase();
    const stmt = db.prepare(query);
    const rows = stmt.all(params || []);
    return rows;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle('db-run', async (event, query, params) => {
  try {
    const db = require('./database').getDatabase();
    const stmt = db.prepare(query);
    const info = stmt.run(params || []);
    return { lastID: info.lastInsertRowid, changes: info.changes };
  } catch (err) {
    throw err;
  }
});

// File dialog handlers
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});
