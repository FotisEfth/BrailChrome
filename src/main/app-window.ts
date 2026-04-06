import { BrowserWindow, WebContentsView, ipcMain, shell, webContents } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { IPC } from '../shared/ipc-channels';

export class AppWindow {
  public mainWindow: BrowserWindow | null = null;
  public webView: WebContentsView | null = null;
  private injectedScript: string = '';
  private controlBarHeight = 80;
  private currentUrl = '';
  private isInjected = false;

  async create() {
    this.loadInjectedScript();

    this.mainWindow = new BrowserWindow({
      width: 1280,
      height: 850,
      minWidth: 800,
      minHeight: 400,
      frame: false,
      backgroundColor: '#000000',
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload-main.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await this.mainWindow.loadFile(
      path.join(__dirname, '../renderer/index.html')
    );

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow!.show();
    });

    // Create WebContentsView for web content (replaces deprecated BrowserView)
    this.webView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
      },
    });

    this.mainWindow.contentView.addChildView(this.webView);
    this.updateWebViewBounds();
    this.setupWebViewEvents();

    // Re-layout when the window is resized
    this.mainWindow.on('resize', () => this.updateWebViewBounds());
    this.mainWindow.on('maximize', () => this.updateWebViewBounds());
    this.mainWindow.on('unmaximize', () => this.updateWebViewBounds());

    // Window control IPC
    ipcMain.on('window-minimize', () => this.mainWindow?.minimize());
    ipcMain.on('window-maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });
    ipcMain.on('window-close', () => this.mainWindow?.close());
    ipcMain.on('focus-url-bar', () => {
      this.mainWindow?.webContents.send('focus-url-bar');
    });

    // Navigate to start page
    await this.navigateTo('https://www.google.com');

    // Intercept keyboard events in the WebContentsView
    this.webView.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown') {
        if (input.key === 'Tab') {
          event.preventDefault();
          const direction = input.shift ? 'prev' : 'next';
          this.webView!.webContents
            .executeJavaScript(
              `window.__brailchrome && window.__brailchrome.focusMove('${direction}')`
            )
            .catch(() => {});
          return;
        }
        if (input.key === 'Escape') {
          this.mainWindow?.webContents.send(IPC.STOP_SPEAKING);
        }
        if ((input.control || input.meta) && input.key === 'l') {
          event.preventDefault();
          this.mainWindow?.webContents.send('focus-url-bar');
        }
      }
    });
  }

  private loadInjectedScript() {
    const bundlePath = path.join(__dirname, '../injected/bundle.js');
    if (fs.existsSync(bundlePath)) {
      this.injectedScript = fs.readFileSync(bundlePath, 'utf8');
      console.log('[BrailChrome] Injected bundle loaded, size:', this.injectedScript.length);
    } else {
      console.warn('[BrailChrome] Injected bundle not found at', bundlePath);
      this.injectedScript = '';
    }
  }

  private updateWebViewBounds() {
    if (!this.mainWindow || !this.webView) return;
    const { width, height } = this.mainWindow.getContentBounds();
    this.webView.setBounds({
      x: 0,
      y: this.controlBarHeight,
      width,
      height: Math.max(0, height - this.controlBarHeight),
    });
  }

  private setupWebViewEvents() {
    if (!this.webView) return;
    const wc = this.webView.webContents;
    const nav = wc.navigationHistory;

    wc.on('did-start-navigation', (details) => {
      if (details.isMainFrame) {
        this.currentUrl = details.url;
        this.isInjected = false;
        this.mainWindow?.webContents.send(IPC.NAV_STATE_CHANGED, {
          url: details.url,
          canGoBack: nav.canGoBack(),
          canGoForward: nav.canGoForward(),
          loading: true,
        });
        this.mainWindow?.webContents.send(
          IPC.SPEAK,
          `Loading ${this.getPageName(details.url)}`
        );
      }
    });

    wc.on('did-finish-load', async () => {
      this.currentUrl = wc.getURL();
      this.mainWindow?.webContents.send(IPC.NAV_STATE_CHANGED, {
        url: this.currentUrl,
        canGoBack: nav.canGoBack(),
        canGoForward: nav.canGoForward(),
        loading: false,
      });
      await this.injectScripts();
    });

    wc.on('did-navigate-in-page', (_event: any, url: string, isMainFrame: boolean) => {
      if (isMainFrame) {
        this.currentUrl = url;
        this.isInjected = false;
        setTimeout(() => this.injectScripts(), 400);
      }
    });

    wc.on('did-fail-load', (_event, errorCode, errorDescription) => {
      if (errorCode === -3) return;
      this.mainWindow?.webContents.send(
        IPC.SPEAK,
        `Failed to load page: ${errorDescription}`
      );
    });

    // Bridge: injected scripts communicate via console.log with a BRAILCHROME: prefix
    // Electron 35: event object has .message property
    wc.on('console-message', (event: any) => {
      const message: string = event.message ?? '';
      if (message.startsWith('BRAILCHROME:')) {
        try {
          const data = JSON.parse(message.slice(9));
          this.handleInjectedMessage(data);
        } catch (_e) {
          // Malformed message
        }
      }
    });

    wc.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private async injectScripts() {
    if (!this.webView) return;
    if (!this.injectedScript) {
      console.warn('[BrailChrome] No injected script available');
      return;
    }

    try {
      await this.webView.webContents.executeJavaScript(this.injectedScript);
      const url = this.webView.webContents.getURL();
      await this.webView.webContents.executeJavaScript(
        `window.__brailchrome && window.__brailchrome.init(${JSON.stringify(url)})`
      );
      this.isInjected = true;
      console.log('[BrailChrome] Scripts injected for', url);
    } catch (e) {
      console.error('[BrailChrome] Failed to inject scripts:', e);
    }
  }

  private handleInjectedMessage(data: any) {
    if (!this.mainWindow) return;
    switch (data.type) {
      case IPC.PAGE_ANALYZED:
        this.mainWindow.webContents.send(IPC.PAGE_MODEL_UPDATED, data.payload);
        this.mainWindow.webContents.send(IPC.PAGE_LOADED, data.payload);
        break;
      case IPC.ELEMENT_INFO:
        this.mainWindow.webContents.send(IPC.ELEMENT_FOCUSED, data.payload);
        break;
      case IPC.FOCUS_CHANGED:
        this.mainWindow.webContents.send(IPC.ELEMENT_FOCUSED, data.payload);
        break;
      default:
        break;
    }
  }

  private getPageName(url: string): string {
    try {
      const u = new URL(url);
      // If it's a Google search, say what they searched for
      if (u.hostname.includes('google') && u.pathname.includes('/search')) {
        const query = u.searchParams.get('q');
        if (query) return `search results for "${query}"`;
      }
      // If it's a Bing search
      if (u.hostname.includes('bing') && u.searchParams.get('q')) {
        return `search results for "${u.searchParams.get('q')}"`;
      }
      return u.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  async navigateTo(url: string) {
    if (!this.webView) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    this.isInjected = false;
    try {
      await this.webView.webContents.loadURL(url);
    } catch (e) {
      console.error('[BrailChrome] Navigation error:', e);
    }
  }

  async executeInPage(code: string): Promise<any> {
    if (!this.webView) return null;
    try {
      return await this.webView.webContents.executeJavaScript(code);
    } catch (e) {
      return null;
    }
  }

  goBack() {
    const nav = this.webView?.webContents.navigationHistory;
    if (nav?.canGoBack()) {
      nav.goBack();
    }
  }

  goForward() {
    const nav = this.webView?.webContents.navigationHistory;
    if (nav?.canGoForward()) {
      nav.goForward();
    }
  }

  reload() {
    this.webView?.webContents.reload();
  }

  getCurrentUrl() {
    return this.currentUrl;
  }

  canGoBack() {
    return this.webView?.webContents.navigationHistory?.canGoBack() ?? false;
  }

  canGoForward() {
    return this.webView?.webContents.navigationHistory?.canGoForward() ?? false;
  }
}
