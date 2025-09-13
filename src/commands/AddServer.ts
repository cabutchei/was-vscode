import * as vscode from 'vscode';
import { ServerStore } from '../services/ServerStore';
import { CommandService } from '../services/CommandService';
import { ServerPersistence } from '../services/ServerPersistence';

export async function addServer(
    context: vscode.ExtensionContext,
    commandService: CommandService,
    serverPersistence: ServerPersistence,
    serverStore: ServerStore) {
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

            let serverInfo = await commandService.getServerInfo(serverPath);
            if (!serverInfo) {
                vscode.window.showErrorMessage("Unrecognized server");
                return;
            }

            const serverName = serverInfo.name;
            const serverFolder = vscode.Uri.joinPath(serversFolder, serverName);

            await vscode.workspace.fs.createDirectory(serverFolder);
            await vscode.workspace.fs.createDirectory(
                vscode.Uri.joinPath(serverFolder, 'deployments')
            );

            const selectedServer = await vscode.window.showQuickPick(
                serverInfo.servers.map(s => ({
                    label: s
                })), {
                placeHolder: 'Select WebSphere server'
            });

            if (!selectedServer) {
                vscode.window.showErrorMessage('No server selected.');
                return;
            }

            const profile = await vscode.window.showQuickPick(
                serverInfo.profiles.map(p => ({
                    label: p
                })), {
                placeHolder: 'Select WebSphere profile'
            });

            if (!profile) {
                vscode.window.showErrorMessage('No profile selected.');
                return;
            }

            let serverType: string = serverInfo.serverType;

            // const serverId = serverStore.addServer(server)
            const serverId = serverStore.addServer(
                serverInfo.name,
                serverPath,
                serverType,
                selectedServer.label,
                profile.label
            );

            commandService.addServer(serverId, serverPath);
            // serverPersistence.save(serverStore.getServer(serverId));
        } else {
            vscode.window.showWarningMessage('No folder selected.');
        }
    });
}
