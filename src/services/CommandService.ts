import * as vscode from 'vscode';
import { AgentConnection } from '../connection/AgentConnection';
import { SMStore } from './Store';
import { ServerProcessService } from './ServerProcessService';
import { ServerInfoResponse, ServerInfoResponsePayload, ServerStatusResponse } from '../protocol/messages';


export class CommandService {
    constructor(
        private conn: AgentConnection,
        private store: SMStore,
        private processSvc: ServerProcessService) {}

    async initialize() {
        await this.conn.handshake();
        this.store.update({ connected: true });
    }

    async addServer(serverId: string, serverPath: string) {
        // const server = this.store.getServer(serverId);
        // if (!server) {
        //     vscode.window.showErrorMessage(`Server with ID ${serverId} already exists.`);
        //     return;
        // }
        this.conn.addServer(
            serverId,
            serverPath
        ).then(() => {
            vscode.window.showInformationMessage(`Server ${serverId} added successfully.`);
        }).catch(err => {
            vscode.window.showErrorMessage(`Failed to add server: ${err.message}`);
        });
    }

    async refreshServerStatus() {
        const resp = await this.conn.serverStatus() as ServerStatusResponse;
                if (resp.success && resp.payload) {
                    this.store.update({ serverState: (resp.payload as any).state, lastChecked: Date.now() });   // do I standardize the status names on the server side?
                }
    }

    async startServer(serverId: string) {   // should be a tcp request too
        vscode.window.showInformationMessage(`Starting server ${serverId}...`);
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
        const startScript = '-cp ' + serverHome + ' MockServer'; // TODO: make this configurable
        const proc = await this.processSvc.launch(
            serverId,
            javaPath,
            startScript,
            logFile
        );

        return new Promise<void>((resolve, reject) => {
            proc.on('close', code => code === 0 ? resolve() : reject(new Error('Start failed')));
        });
        }

    async stopServer(serverId: string) {
        await this.processSvc.stop(serverId);   // change of plans, management server should control the process. TODO: change this to a tcp request
    }

    async startApplication(appId: string) {
        const resp = await this.conn.startAplication();
    }

    async getServerInfo(path: string): Promise<ServerInfoResponsePayload>
    async getServerInfo(path: vscode.Uri): Promise<ServerInfoResponsePayload>
    async getServerInfo(value: string | vscode.Uri): Promise<ServerInfoResponsePayload> {
        let path: string;
        if (value instanceof vscode.Uri) {
            value = value.fsPath;
        }
        path = value;
        const resp = await this.conn.getServerInfo(path) as ServerInfoResponse;
        return resp.payload;


    }
}