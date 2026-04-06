import { ipcMain } from 'electron';
import { AppWindow } from './app-window';
import { IPC } from '../shared/ipc-channels';

export function registerIpcHandlers(appWindow: AppWindow) {
  // Navigation
  ipcMain.on(IPC.NAVIGATE_URL, async (_event, url: string) => {
    await appWindow.navigateTo(url);
  });

  ipcMain.on(IPC.NAVIGATE_BACK, () => appWindow.goBack());
  ipcMain.on(IPC.NAVIGATE_FORWARD, () => appWindow.goForward());
  ipcMain.on(IPC.RELOAD, () => appWindow.reload());

  // Focus management
  ipcMain.on(IPC.FOCUS_NEXT, async () => {
    await appWindow.executeInPage(
      `window.__brailchrome && window.__brailchrome.focusMove('next')`
    );
  });

  ipcMain.on(IPC.FOCUS_PREV, async () => {
    await appWindow.executeInPage(
      `window.__brailchrome && window.__brailchrome.focusMove('prev')`
    );
  });

  ipcMain.on(IPC.FOCUS_SECTION, async (_event, sectionName: string) => {
    await appWindow.executeInPage(
      `window.__brailchrome && window.__brailchrome.navigateToSection(${JSON.stringify(sectionName)})`
    );
  });

  ipcMain.on(IPC.CLICK_CURRENT, async () => {
    await appWindow.executeInPage(
      `window.__brailchrome && window.__brailchrome.clickCurrent()`
    );
  });

  // Text input
  ipcMain.on(IPC.TYPE_TEXT, async (_event, text: string) => {
    await appWindow.executeInPage(
      `window.__brailchrome && window.__brailchrome.typeText(${JSON.stringify(text)})`
    );
  });

  // Information queries
  ipcMain.on(IPC.WHERE_AM_I, async () => {
    const result = await appWindow.executeInPage(
      `window.__brailchrome && window.__brailchrome.whereAmI()`
    );
    if (result && appWindow.mainWindow) {
      appWindow.mainWindow.webContents.send(IPC.SPEAK, result);
    }
  });

  ipcMain.on(IPC.READ_PAGE, async () => {
    const result = await appWindow.executeInPage(
      `window.__brailchrome && window.__brailchrome.readPage()`
    );
    if (result && appWindow.mainWindow) {
      appWindow.mainWindow.webContents.send(IPC.SPEAK, result);
    }
  });

  ipcMain.on(IPC.GET_PAGE_MODEL, async (event) => {
    const result = await appWindow.executeInPage(
      `window.__brailchrome && window.__brailchrome.getPageModel()`
    );
    event.returnValue = result;
  });

  // Settings (stub — extend with electron-store if needed)
  ipcMain.handle(IPC.GET_SETTINGS, () => {
    return {};
  });

  ipcMain.on(IPC.SAVE_SETTINGS, (_event, _settings) => {
    // TODO: persist settings with electron-store
  });
}
