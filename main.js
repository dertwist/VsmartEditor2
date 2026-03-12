const { app, BrowserWindow, ipcMain, Menu } = require('electron/main')
const path = require('node:path')
const fs = require('fs')

let mainWindow = null

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New',          accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.executeJavaScript('newDocument()') },
        { label: 'Import JSON',  click: () => mainWindow.webContents.executeJavaScript('importJSON()') },
        { label: 'Import KV3',   click: () => mainWindow.webContents.executeJavaScript('importKV3()') },
        { label: 'Export JSON',  click: () => mainWindow.webContents.executeJavaScript('exportJSON()') },
        { label: 'Export KV3',   click: () => mainWindow.webContents.executeJavaScript('exportKV3()') },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Add Element',  accelerator: 'CmdOrCtrl+F',          click: () => mainWindow.webContents.executeJavaScript('document.getElementById("btnAddElement").click()') },
        { label: 'Add Variable',                                       click: () => mainWindow.webContents.executeJavaScript('document.getElementById("btnAddVariable").click()') },
        { type: 'separator' },
        { label: 'Undo',         accelerator: 'CmdOrCtrl+Shift+Z',   click: () => mainWindow.webContents.executeJavaScript('undo()') },
        { label: 'Redo',         accelerator: 'CmdOrCtrl+Y',          click: () => mainWindow.webContents.executeJavaScript('redo()') },
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About SmartProp Editor', click: () => { /* show dialog */ } }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow(filePath) {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    icon: path.join(__dirname, 'assets/images/vdata_editor/appicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })
  mainWindow.loadFile('index.html')

  buildMenu()

  // Once loaded, send the file path to renderer
  if (filePath) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('open-file', filePath)
    })
  }
}

// macOS: file opened via Finder
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (mainWindow) {
    mainWindow.webContents.send('open-file', filePath)
  } else {
    app.whenReady().then(() => createWindow(filePath))
  }
})

app.whenReady().then(() => {
  // Windows: file path passed as CLI argument
  const args = process.argv.slice(app.isPackaged ? 1 : 2)
  const filePath = args.find(a => a.endsWith('.vsmart')) || null
  createWindow(filePath)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(null)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('read-file', async (_event, filePath) => {
  return fs.readFileSync(filePath, 'utf-8')
})
