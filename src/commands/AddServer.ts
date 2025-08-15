import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { Server, ServerStore } from '../services/ServerStore';
import { CommandService } from '../services/CommandService';
import { v4 as uuid } from 'uuid';
import { ServerTypes } from '../services/ServerTypes';


export async function addServer(context: vscode.ExtensionContext, commandService: CommandService, descriptorService: DescriptorService, serverStore: ServerStore): Promise<void> {
    const folder = vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select WebSphere Server Directory',
        title: 'Add WebSphere Server'
    });

    return folder.then(async selectedFolder => {
        if (selectedFolder && selectedFolder.length > 0) {
            const serverPath = selectedFolder[0].fsPath;
            const serversFolder = vscode.Uri.joinPath(context.storageUri!, 'servers');
            vscode.window.showInformationMessage(`Server added: ${serverPath}`);
            const serverName = "WebSphere 8.5";
            const serverFolder = vscode.Uri.joinPath(serversFolder, serverName)
            vscode.workspace.fs.createDirectory(serverFolder);
            vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(serverFolder, 'deployments'));
            let serverInfo = await commandService.getServerInfo(serverPath);
            if (!serverInfo) {
                vscode.window.showErrorMessage("Unrecognized server");
                return;
            }

            const serverrr = await vscode.window.showQuickPick(serverInfo.servers.map(s => ({
                label: s,
            })), {
                placeHolder: 'Select WebSphere server'
            });
            if (!serverrr) {
                vscode.window.showErrorMessage('No server selected.');
                return;
            }

            const profile = await vscode.window.showQuickPick(serverInfo.profiles.map(p => ({
                label: p,
            })), {
                placeHolder: 'Select WebSphere profile'
            });
            if (!profile) {
                vscode.window.showErrorMessage('No profile selected.');
                return;
            }

            let serverType = ServerTypes.get(serverInfo.id);
            if (!serverType) {
                vscode.window.showErrorMessage(`Unknown server type: ${serverInfo.id}`);
                return;
            }
            let server: Server = {
                id: uuid(), // should id be set here? And should it be a uuid?
                name: serverInfo.name,
                path: serverPath,
                server: serverrr.label,
                profile: profile.label
            }

            serverStore.setServerType(server.id, serverType);
            serverStore.addServer(server)
            commandService.addServer(server.id, serverPath);
        } else {
            vscode.window.showWarningMessage('No folder selected.');
        }
    });
}