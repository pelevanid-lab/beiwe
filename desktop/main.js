const { app, BrowserWindow, Menu, MenuItem, ipcMain } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Disables CORS/Same-Origin for testing
    }
  });

  // Strip X-Frame-Options and Content-Security-Policy to allow framing any site
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    let headers = details.responseHeaders;
    
    // Delete headers that block iframing
    if (headers['x-frame-options']) { delete headers['x-frame-options']; }
    if (headers['X-Frame-Options']) { delete headers['X-Frame-Options']; }
    if (headers['content-security-policy']) { delete headers['content-security-policy']; }
    if (headers['Content-Security-Policy']) { delete headers['Content-Security-Policy']; }
    
    // Delete headers that break window.opener (COOP/COEP) for Firebase Auth Popups
    if (headers['Cross-Origin-Opener-Policy']) { delete headers['Cross-Origin-Opener-Policy']; }
    if (headers['cross-origin-opener-policy']) { delete headers['cross-origin-opener-policy']; }
    if (headers['Cross-Origin-Embedder-Policy']) { delete headers['Cross-Origin-Embedder-Policy']; }
    if (headers['cross-origin-embedder-policy']) { delete headers['cross-origin-embedder-policy']; }
    
    callback({
      cancel: false,
      responseHeaders: headers
    });
  });

  // Specifically handle popups so Firebase Auth window.opener works
  win.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        }
      }
    };
  });

  // Handle right-click Context Menu
  win.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    // Only show our custom options if some text is selected
    if (params.selectionText && params.selectionText.trim().length > 0) {
      menu.append(new MenuItem({
        label: '👤 Müşteri Oluştur',
        click: () => {
          win.webContents.executeJavaScript(`
            (function() {
              const input = document.getElementById('main-search-input');
              if (input) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                nativeInputValueSetter.call(input, "/yeni-musteri " + ${JSON.stringify(params.selectionText)});
                const ev2 = new Event('input', { bubbles: true});
                input.dispatchEvent(ev2);
                
                const form = input.closest('form');
                if (form) {
                   const btn = form.querySelector('button[type="submit"]');
                   if (btn) btn.click();
                }
              }
            })();
          `);
        }
      }));
      
      menu.append(new MenuItem({
        label: '💬 Konuşmayı Müşteriye Kaydet',
        click: () => {
          win.webContents.executeJavaScript(`
            (function() {
              const input = document.getElementById('main-search-input');
              if (input) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                nativeInputValueSetter.call(input, "/musteriye-not " + ${JSON.stringify(params.selectionText)});
                const ev2 = new Event('input', { bubbles: true});
                input.dispatchEvent(ev2);
                
                const form = input.closest('form');
                if (form) {
                   const btn = form.querySelector('button[type="submit"]');
                   if (btn) btn.click();
                }
              }
            })();
          `);
        }
      }));
      
      menu.append(new MenuItem({ type: 'separator' }));
    }
    
    // Standard options
    menu.append(new MenuItem({ role: 'copy', label: 'Kopyala' }));
    
    menu.popup();
  });

  win.loadURL('http://localhost:3000/tr/app');
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  app.userAgentFallback = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 BeiweOS/1.0";
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
