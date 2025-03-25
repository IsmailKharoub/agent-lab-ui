import { contextBridge, ipcRenderer } from 'electron';

// Preload script runs in the renderer process before the web page loads
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency] || '')
  }
})

// Expose Electron functionality to the renderer process
contextBridge.exposeInMainWorld('electron', {
  send: (channel: string, data: any) => {
    // whitelist channels
    let validChannels = ['message-from-renderer']
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    let validChannels = ['message-from-main']
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  }
}); 