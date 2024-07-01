import path from "path";
import { Menu, Tray } from "electron";

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
}