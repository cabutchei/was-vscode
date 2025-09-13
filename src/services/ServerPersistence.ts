import * as vscode from 'vscode';
import { Server } from './ServerFactory';
import { v4 as uuid } from 'uuid';
import { Deployment, ServerStore } from './ServerStore';
import { write } from 'fs';



export class ServerPersistence {
    private dir!: vscode.Uri;
    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly serverStore: ServerStore
    ) {}

    async init() {
        const storageUri = this.context.storageUri;
        if (!storageUri) {
            vscode.window.showErrorMessage('Open a folder/workspace first.');
            return;
        }
        this.dir = vscode.Uri.joinPath(storageUri, 'servers')
        await vscode.workspace.fs.createDirectory(this.dir);
        (await this.list()).forEach(
            server => this.serverStore.restoreServer(server)
        );
        this.serverStore.onAddServer(
            e => this.save(this.serverStore.getServer(e.id)))
            this.serverStore.onAddDeployment(
                e => {
                    this.saveDeployment(e.deployment);
                }
            )
    }

    private uriFor(id: string) {
        return vscode.Uri.joinPath(this.dir, `${id}.json`);
    }

    async list(): Promise<Server[]> {
        const servers: Server[] = [];
        let serverFile: vscode.Uri;
        let server: Server;
        for (const [name, kind] of await vscode.workspace.fs.readDirectory(this.dir)) {
            if (kind !== vscode.FileType.Directory) continue;
            let out;
            serverFile = vscode.Uri.joinPath(this.dir, name, 'server.json');
            const buf = await vscode.workspace.fs.readFile(serverFile);
            const content: string = Buffer.from(buf).toString('utf8');
            out = JSON.parse(content);
            server = {id: uuid(), ...out}
            servers.push(server); 
            Buffer.from(buf).toString('utf8');
        }
        // return out.sort((a, b) => a.name.localeCompare(b.name));
        return servers;
    }

    async save(server: Server | undefined) { 
        if (!server) return;
        let serverDirName: string = server.uniqueLabel;
        let serverDir = vscode.Uri.joinPath(
            this.dir, server.uniqueLabel);
        serverDir = vscode.Uri.joinPath(this.dir, serverDirName);
        await vscode.workspace.fs.createDirectory(serverDir);
        const writeData = Buffer.from(JSON.stringify(serverDir, null, 2), 'utf8');
        const serverFile = vscode.Uri.joinPath(serverDir, 'server.json');
        await vscode.workspace.fs.writeFile(serverFile, writeData);
    }

    async remove(id: string) {
        await vscode.workspace.fs.delete(this.uriFor(id));
    }

    async saveDeployment(deployment: Deployment) {
        const appName = deployment.label;
        const serverUniqueLabel = this.serverStore.getServer(deployment.serverId)?.uniqueLabel;
        if(!serverUniqueLabel) return;
        const deploymentDir = vscode.Uri.joinPath(
            this.dir, serverUniqueLabel, 'deployments', `${appName}.ear`);
        await vscode.workspace.fs.createDirectory(deploymentDir);
        const writeData = Buffer.from(JSON.stringify(deployment, null, 2), 'utf8');
        const appFile = vscode.Uri.joinPath(deploymentDir, 'application.json');
        await vscode.workspace.fs.writeFile(appFile, writeData);
    }
}
