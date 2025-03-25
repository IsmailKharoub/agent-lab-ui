// This is a CommonJS file to bootstrap the Electron app
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // In development mode, load from development server
  // In production, load from built files
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('Loading from development server');
    // Assuming vite dev server runs on port 5173 by default
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // Try to load from built files
    const distPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading from:', distPath);
    try {
      mainWindow.loadFile(distPath);
    } catch (err) {
      console.error('Failed to load from dist, loading development server instead:', err);
      mainWindow.loadURL('http://localhost:5173');
    }
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', function () {
  // On macOS, applications and their menu bar stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // On macOS, re-create a window when the dock icon is clicked and there are no other windows open
  if (mainWindow === null) createWindow();
});

// Handle IPC messages from the renderer process
ipcMain.on('message-from-renderer', (event, arg) => {
  console.log('Message from renderer:', arg);
  event.reply('message-from-main', 'Hello from the main process!');
}); 