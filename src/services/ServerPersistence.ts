// src/services/FileServerPersistence.ts
import * as vscode from 'vscode';
import { Server } from './ServerStore';
import { v4 as uuid } from 'uuid';



export class ServerPersistence {
    private dir!: vscode.Uri;
    constructor(private readonly context: vscode.ExtensionContext) {}

    async init() {
        const storageUri = this.context.storageUri;
        if (!storageUri) {
            vscode.window.showErrorMessage('Open a folder/workspace first.');
            return;
        }
        // await vscode.workspace.fs.createDirectory(storageUri);
        this.dir = vscode.Uri.joinPath(storageUri, 'servers')
        await vscode.workspace.fs.createDirectory(this.dir);
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
            out = JSON.parse(Buffer.from(buf).toString('utf8'));
            server = {id: uuid(), ...out}
            servers.push(server); 
        }
        // return out.sort((a, b) => a.name.localeCompare(b.name));
        return servers;
    }

    async save(inst: Server) {
        await vscode.workspace.fs.writeFile(this.uriFor(inst.id), Buffer.from(JSON.stringify(inst, null, 2), 'utf8'));
    }

    async remove(id: string) {
        await vscode.workspace.fs.delete(this.uriFor(id));
    }
}
