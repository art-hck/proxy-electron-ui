import { app, BrowserWindow, ipcMain, Notification } from "electron";
import path from "path";
import fs from "fs";
import { createServer } from "node:https";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Server } from "https";
import { Storage } from "../utils/storage";

declare const PROXY_WEBPACK_ENTRY: string;
declare const PROXY_PRELOAD_WEBPACK_ENTRY: string;

export type Host = {
    name: string,
    url: string
};
export type Hosts = Array<Host>

export class ProxyService {
    private onChange: (data: { connected: boolean, host?: Host }) => void;
    readonly storage = new Storage<Hosts>(path.join(app.getPath('userData'), "/hosts"));
    private server: Server;

    private readonly browserWindow = new BrowserWindow({
        height: 400,
        width: 750,
        autoHideMenuBar: true,
        webPreferences: {
            preload: PROXY_PRELOAD_WEBPACK_ENTRY,
        },
        frame: false,
        show: false
    });

    constructor() {
        this.init();
    }

    private async init() {
        this.browserWindow.loadURL(PROXY_WEBPACK_ENTRY);
        // this.browserWindow.webContents.openDevTools();

        ipcMain.handle('proxy-minimize', () => this.browserWindow.minimize());
        ipcMain.handle('proxy-close', () => this.browserWindow.hide());
        ipcMain.handle('proxy-write-storage', (_, hosts: Hosts) => this.storage.set(hosts));
        ipcMain.handle('proxy-read-storage', () => this.storage.get().catch(() => []));
        ipcMain.handle('proxy-disconnect', () => new Promise<void>(ok => this.server?.close(() => ok()) || ok())
            .then(() => this.onChange?.({ connected: false })));
        ipcMain.handle('proxy-connect', (_, host: Host) => new Promise<void>((resolve, reject) => {
            const connect = () => {
                const express = require("express")();
                const wsProxy = createProxyMiddleware({ ws: true, target: host.url.replace(/^http/, 'ws'), changeOrigin: true, secure: false });
                express.use('/', createProxyMiddleware({ target: host.url, secure: false, changeOrigin: true }))
                express.use(wsProxy);
                this.server = createServer({
                    key: fs.readFileSync(path.join(__dirname, '/assets/ssl/key.pem'), "utf8"),
                    cert: fs.readFileSync(path.join(__dirname, '/assets/ssl/cert.pem'), "utf8")
                }, express);

                this.server.listen(8443, () => {
                    this.onChange?.({ connected: true, host })
                    resolve();
                });
                this.server.on('upgrade', wsProxy.upgrade);
                this.server.once("error", (e) => {
                    this.onChange?.({ connected: false })
                    new Notification({ title: 'Connection error', body: e.message }).show();
                    reject(e);
                });
            }

            this.server?.close(() => connect()) || connect();
        }));
    }

    show() {
        this.browserWindow.show()
    }

    registerOnChangeFn(onChange: (data: { connected: boolean, host?: Host }) => void) {
        this.onChange = onChange;
    }
}