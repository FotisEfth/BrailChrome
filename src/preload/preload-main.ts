import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Send to main ──────────────────────────────────────────────────────────
  navigateUrl: (url: string) => ipcRenderer.send(IPC.NAVIGATE_URL, url),
  navigateBack: () => ipcRenderer.send(IPC.NAVIGATE_BACK),
  navigateForward: () => ipcRenderer.send(IPC.NAVIGATE_FORWARD),
  reload: () => ipcRenderer.send(IPC.RELOAD),

  focusNext: () => ipcRenderer.send(IPC.FOCUS_NEXT),
  focusPrev: () => ipcRenderer.send(IPC.FOCUS_PREV),
  focusSection: (name: string) => ipcRenderer.send(IPC.FOCUS_SECTION, name),
  clickCurrent: () => ipcRenderer.send(IPC.CLICK_CURRENT),
  typeText: (text: string) => ipcRenderer.send(IPC.TYPE_TEXT, text),

  whereAmI: () => ipcRenderer.send(IPC.WHERE_AM_I),
  readPage: () => ipcRenderer.send(IPC.READ_PAGE),

  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),

  // ── Receive from main ─────────────────────────────────────────────────────
  onSpeak: (callback: (text: string) => void) =>
    ipcRenderer.on(IPC.SPEAK, (_evt, text) => callback(text)),

  onStopSpeaking: (callback: () => void) =>
    ipcRenderer.on(IPC.STOP_SPEAKING, () => callback()),

  onPageLoaded: (callback: (model: any) => void) =>
    ipcRenderer.on(IPC.PAGE_LOADED, (_evt, model) => callback(model)),

  onPageModelUpdated: (callback: (model: any) => void) =>
    ipcRenderer.on(IPC.PAGE_MODEL_UPDATED, (_evt, model) => callback(model)),

  onElementFocused: (callback: (info: any) => void) =>
    ipcRenderer.on(IPC.ELEMENT_FOCUSED, (_evt, info) => callback(info)),

  onNavStateChanged: (callback: (state: any) => void) =>
    ipcRenderer.on(IPC.NAV_STATE_CHANGED, (_evt, state) => callback(state)),

  onFocusUrlBar: (callback: () => void) =>
    ipcRenderer.on('focus-url-bar', () => callback()),
});
