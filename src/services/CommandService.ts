import * as vscode from 'vscode';
import { AgentConnection } from '../connection/AgentConnection';
import { Store } from './Store';
import { ServerProcessService } from './ServerProcessService';


export class CommandService {
    constructor(
        private conn: AgentConnection,
        private store: Store,
        private processSvc: ServerProcessService) {}

    async initialize() {
        await this.conn.handshake();
        this.store.update({ connected: true });
    }

    async refreshServerStatus() {
        const resp = await this.conn.serverStatus();
        if (resp.type === 'response' && resp.success && resp.payload) {
        this.store.update({ serverState: (resp.payload as any).state, lastChecked: Date.now() });   // do I standardize the status names on the server side?
        }
    }

    async startServer(serverId: string) {
        const cfg = vscode.workspace.getConfiguration('websphere');
        const javaPath = cfg.get('server.javaPath', null);
        const serverHome = cfg.get('server.home', null);
        const logFile = cfg.get('server.logFile', null);
        if (!serverHome) {
            throw new Error('`websphere.server.home` must be set');
        }
        if (!javaPath) {
            throw new Error('`websphere.server.home` must be set');
        }
        if (!logFile) {
            throw new Error('`websphere.server.home` must be set');
        }
        const proc = await this.processSvc.launch(
            serverId,
            javaPath,
            serverHome,
            logFile
        );

        return new Promise<void>((resolve, reject) => {
            proc.on('close', code => code === 0 ? resolve() : reject(new Error('Start failed')));
        });
        }

    async stopServer(serverId: string) {
        await this.processSvc.stop(serverId);
    }
}