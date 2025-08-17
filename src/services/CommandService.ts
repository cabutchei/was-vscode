import * as vscode from 'vscode';
import { AgentConnection } from '../connection/AgentConnection';
import { SMStore } from './SMStore';
import { ServerProcessService } from './ServerProcessService';
import { InboundMessage, ServerInfoResponse, ServerInfoResponsePayload, ServerStatusResponse } from '../protocol/messages';


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

    async startServer(serverId: string) {
        vscode.window.showInformationMessage(`Starting server ${serverId}...`);
        await this.conn.startServer(serverId)
            .then()
            .catch(err => vscode.window.showErrorMessage(`Failed to start server ${serverId}: ${err.message}`));
    }

    async stopServer(serverId: string) {
        vscode.window.showInformationMessage(`Stopping server ${serverId}...`);
        await this.conn.stopServer(serverId)
            .then()
            .catch(err => vscode.window.showErrorMessage(`Failed to stop server ${serverId}: ${err.message}`));
        setTimeout(() => this.processSvc.stopTailing('id'),
            15000)  // this should actually wait for the server stop notification
    }

    streamLogs(serverId: string) {
        this.processSvc.startTailing('id', 'C:/Desenvolvimento/IBM/WebSphere/AppServer_8_5/profiles/AppSrv03/logs/server1/SystemOut.log');
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