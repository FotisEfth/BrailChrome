import { app, BrowserWindow, ipcMain, globalShortcut, session } from 'electron';
import * as path from 'path';
import { AppWindow } from './app-window';
import { registerIpcHandlers } from './ipc-handlers';

let appWindow: AppWindow;

app.whenReady().then(async () => {
  // Grant microphone and media permissions for Web Speech API (STT)
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'microphone', 'audioCapture'];
    callback(allowed.includes(permission as string));
  });

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    const allowed = ['media', 'microphone', 'audioCapture'];
    return allowed.includes(permission as string);
  });

  // Strip CSP and X-Frame-Options so injected scripts work on all sites
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    delete headers['content-security-policy'];
    delete headers['Content-Security-Policy'];
    delete headers['content-security-policy-report-only'];
    delete headers['Content-Security-Policy-Report-Only'];
    delete headers['x-frame-options'];
    delete headers['X-Frame-Options'];
    callback({ responseHeaders: headers });
  });

  appWindow = new AppWindow();
  await appWindow.create();
  registerIpcHandlers(appWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    appWindow = new AppWindow();
    await appWindow.create();
    registerIpcHandlers(appWindow);
  }
});
