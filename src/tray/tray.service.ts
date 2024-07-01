import path from "path";
import { Menu, Tray } from "electron";
import { Host } from "../proxy/proxy.service";

export class TrayService {
    private readonly contextMenu = Menu.buildFromTemplate([
        { label: 'Выход', click: () => this.events.onClose() },
    ]);
    private readonly tray: Tray = new Tray(path.join(__dirname, '/assets/tray.png'));

    constructor(private events: {
        onClose: () => void
        onProxy: () => void
    }) {
        this.tray.setContextMenu(this.contextMenu);
        this.tray.addListener('click', () => this.events.onProxy());
    }

    update(data: { connected: boolean, host?: Host }) {
        this.tray.setImage(path.join(__dirname, data.connected ? '/assets/tray-connected.png' : '/assets/tray.png'));
        this.tray.setToolTip(data.connected ? data.host?.name : '');
    }
}