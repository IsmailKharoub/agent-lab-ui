import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

// Keep a global reference of the window object to avoid garbage collection
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    // Development - load from dev server
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // Production - load built files
    mainWindow.loadFile(path.join(process.env.DIST || 'dist', 'index.html'));
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