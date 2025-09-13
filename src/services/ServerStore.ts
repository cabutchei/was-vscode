import * as vscode from 'vscode';
import { ServerStatus } from './ServerStatusManager';
import { ServerTypes } from './ServerTypes';
import { v4 as uuid } from 'uuid';
import { Server, ServerFactory } from './ServerFactory';


export interface Deployment {
    serverId: string;
    label: string;
    path: string;
}

export class ServerStore {
    private servers = new Map<string, Server>();
    private deployments = new Map<string, Deployment>();
    private byId = new Map<string, ServerStatus>();
    private _onDidChange = new vscode.EventEmitter<{ id: string; status: ServerStatus }>();
    private _onAddDeployment = new vscode.EventEmitter<{ serverId: string, deployment: Deployment }>();
    readonly onAddDeployment = this._onAddDeployment.event;
    readonly onAddServer = this._onDidChange.event;

    empty(): boolean {
        return this.servers.size === 0;
    }

    getServer(id: string): Server | undefined {
        return this.servers.get(id);
    }

    getServers(): Server[] {
        return Array.from(this.servers.values());
    }

    getServerMap(): Map<string, Server> {
        return this.servers;
    }

    addServer(name: string, path: string, serverType: string, baseServerName: string, webSphereProfileName: string): string {
        const serverId = uuid();
        const label = ServerTypes.getLabelForServer(serverType);
        let server = ServerFactory.create(
            name, this.generateUniqueLabel(label), path,
            serverType, baseServerName, webSphereProfileName
        );
        this.servers.set(serverId, server);
        this._onDidChange.fire({id: serverId, status: this.getServerStatus(serverId)});
        return serverId;
    }

    restoreServer(server: Server) {
        const serevrId = uuid();
        this.servers.set(serevrId, server);
    }

    generateUniqueLabel(label: string): string {
        let uniqueLabel = label;
        let id = 2;
        for (const server of this.getServers()) {
            if (uniqueLabel === server.uniqueLabel) {
                uniqueLabel = `${uniqueLabel} (${id++})`;
            }
        }
        return uniqueLabel;
    }


    getServerStatus(id: string): ServerStatus { return this.byId.get(id) ?? 'unknown'; }

    setServerStatus(id: string, status: ServerStatus): void {
        const prev = this.byId.get(id);
        if (prev === status) return;
        const server = this.getServer(id);
        this.byId.set(id, status);
        this._onDidChange.fire({ id, status });
    }

    setStarting(id: string) { this.setServerStatus(id, 'starting'); }
    setRunning(id: string)  { this.setServerStatus(id, 'started'); }
    setStopping(id: string) { this.setServerStatus(id, 'stopping'); }
    setStopped(id: string)  { this.setServerStatus(id, 'stopped'); }
    setFailed(id: string)   { this.setServerStatus(id, 'failed'); }

    
    addDeployment(serverId: string, deployment: Deployment): void {
        this.deployments.set(serverId, deployment);
        if (deployment) this._onAddDeployment.fire({ serverId, deployment });
    }

    getDeployment(serverId: string, name: string): Deployment | undefined {
        return this.deployments.get(serverId);
    }


    removeDeployment(serverId: string, deploymentId: string): void {
        this.deployments.delete(serverId);
    }
}
