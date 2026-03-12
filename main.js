const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const fs = require('fs')

let mainWindow = null

function createWindow(filePath) {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })
  mainWindow.loadFile('index.html')

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
