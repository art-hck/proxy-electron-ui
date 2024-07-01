import { app, ipcMain } from 'electron';
import { TrayService } from "./tray/tray.service";
import { ProxyService } from "./proxy/proxy.service";

if (require('electron-squirrel-startup')) {
    app.quit();
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit();
} else {
    app.on('ready', async () => {
        const proxy = new ProxyService();
        const trayService = new TrayService({
            onProxy: () => proxy.show(),
            onClose: () => app.quit(),
        });
        proxy.registerOnChangeFn(data => trayService.update(data))
        proxy.show();

        ipcMain.handle('log', (e, ...args) => console.log(...args));
    });
}
