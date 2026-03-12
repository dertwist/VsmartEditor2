const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
onOpenFile: (callback) => ipcRenderer.on('open-file', (_event, path) => callback(path)),
readFile: (filePath) => ipcRenderer.invoke('read-file', filePath)
})