import * as vscode from 'vscode';
import { ServerStatus } from './ServerStatusManager';
import { ServerType } from './ServerTypes';
import { v4 as uuid } from 'uuid';



export interface Server {
    id: string;
    name: string;
    path: string;
    server: string;
    profile: string;
}

export interface Deployment {
    id: string;
    serverId: string;
    label: string;
    sourcePath: string;
}

export class ServerStore {
    private emitter = new vscode.EventEmitter<Server[]>();
    private servers: Server[] = [];
    private deployments: { [serverId: string]: Deployment[] } = {};
    private serverTypes: Map<string, ServerType> = new Map();
    private byId = new Map<string, ServerStatus>();
    private _onDidChange = new vscode.EventEmitter<{ id: string; status: ServerStatus }>();
    readonly onDidChange = this._onDidChange.event;

    empty(): boolean {
        return this.servers.length === 0;
    }

    getServer(id: string): Server | undefined {
        return this.servers.find(server => server.id === id);
    }

    getServers(): Server[] {
        return this.servers;
    }

    addServer(server: Server): void {
        this.servers.push(server);
        this.deployments[server.id] = [];
        this._onDidChange.fire({id: server.id, status: 'unknown'});
    }

    getServerType(id: string): ServerType | undefined {
        return this.serverTypes.get(id);
    }
    setServerType(id: string, type: ServerType): void {
        this.serverTypes.set(id, type);
    }

    getServerStatus(id: string): ServerStatus { return this.byId.get(id) ?? 'unknown'; }

    setServerStatus(id: string, status: ServerStatus): void {
        const prev = this.byId.get(id);
        if (prev === status) return;
        const server = this.servers.find(s => s.id === id);
        this.byId.set(id, status);
        this._onDidChange.fire({ id, status });
    }

    setStarting(id: string) { this.setServerStatus(id, 'starting'); }
    setRunning(id: string)  { this.setServerStatus(id, 'started'); }
    setStopping(id: string) { this.setServerStatus(id, 'stopping'); }
    setStopped(id: string)  { this.setServerStatus(id, 'stopped'); }

    getDeployments(serverId: string): Deployment[] {
        return this.deployments[serverId] || [];
    }

    addDeployment(serverId: string, deployment: Deployment): void {
        if (!this.deployments[serverId]) {
            this.deployments[serverId] = [];
        }
        this.deployments[serverId].push(deployment);
    }

    removeDeployment(serverId: string, deploymentId: string): void {
        if (this.deployments[serverId]) {
            this.deployments[serverId] = this.deployments[serverId].filter(d => d.id !== deploymentId);
        }
    }
}
