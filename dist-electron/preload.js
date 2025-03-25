"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Preload script runs in the renderer process before the web page loads
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element)
            element.innerText = text;
    };
    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency] || '');
    }
});
// Expose Electron functionality to the renderer process
electron_1.contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = ['message-from-renderer'];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let validChannels = ['message-from-main'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`
            electron_1.ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});
//# sourceMappingURL=preload.js.map