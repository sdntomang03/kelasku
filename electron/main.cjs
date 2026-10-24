const { app, BrowserWindow, dialog, globalShortcut, net, protocol, shell } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const APP_SCHEME = 'app'
const APP_HOST = 'kelasku'
const WEB_ROOT = path.join(__dirname, '..', 'dist')
const EXIT_SEQUENCE_TIMEOUT_MS = 5000
const hasSingleInstanceLock = app.requestSingleInstanceLock()
let mainWindow
let exitSequenceArmed = false
let exitSequenceTimer

if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    mainWindow.show()
    mainWindow.focus()
  })
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
])

function isAppUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === `${APP_SCHEME}:` && url.hostname === APP_HOST
  } catch {
    return false
  }
}

async function serveAppFile(request) {
  const url = new URL(request.url)
  let pathname
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const filePath = path.resolve(WEB_ROOT, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (filePath !== WEB_ROOT && !filePath.startsWith(`${WEB_ROOT}${path.sep}`)) {
    return new Response('Not found', { status: 404 })
  }

  try {
    return await net.fetch(pathToFileURL(filePath).toString())
  } catch (error) {
    console.error(`Failed to serve desktop asset "${pathname}":`, error)
    return new Response('Failed to load application resource', { status: 500 })
  }
}

function registerExitShortcuts() {
  const cRegistered = globalShortcut.register('Control+Alt+C', () => {
    exitSequenceArmed = true
    clearTimeout(exitSequenceTimer)
    exitSequenceTimer = setTimeout(() => {
      exitSequenceArmed = false
    }, EXIT_SEQUENCE_TIMEOUT_MS)
  })
  const bRegistered = globalShortcut.register('Control+Alt+B', () => {
    if (!exitSequenceArmed) return
    clearTimeout(exitSequenceTimer)
    app.exit(0)
  })

  if (cRegistered && bRegistered) return true

  globalShortcut.unregisterAll()
  dialog.showErrorBox(
    'Tidak dapat mengunci aplikasi',
    'Shortcut keluar Ctrl+Alt+C lalu Ctrl+Alt+B tidak tersedia. Tutup aplikasi lain yang memakai shortcut tersebut, lalu jalankan kembali.',
  )
  app.quit()
  return false
}

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('close', (event) => {
    event.preventDefault()
  })
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return

    const key = input.key.toLowerCase()
    const control = input.control || input.meta
    const blockedNavigationShortcut = control && ['r', 'w', 'n', 't', 'l', 'p', 's', 'u'].includes(key)
    const blockedDevToolsShortcut = control && input.shift && ['i', 'j', 'c'].includes(key)
    const blockedWindowShortcut = input.key === 'F5'
      || input.key === 'F11'
      || input.key === 'F12'
      || input.key === 'Escape'
      || (input.alt && input.key === 'F4')

    if (blockedNavigationShortcut || blockedDevToolsShortcut || blockedWindowShortcut) {
      event.preventDefault()
    }
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault()
      if (url.startsWith('https://') || url.startsWith('http://')) {
        void shell.openExternal(url)
      }
    }
  })
  void mainWindow.loadURL(`${APP_SCHEME}://${APP_HOST}/`).catch((error) => {
    console.error('Failed to load the Kelasku desktop application:', error)
  })
}

app.whenReady().then(() => {
  if (!hasSingleInstanceLock || !registerExitShortcuts()) return

  protocol.handle(APP_SCHEME, serveAppFile)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  clearTimeout(exitSequenceTimer)
  globalShortcut.unregisterAll()
})
