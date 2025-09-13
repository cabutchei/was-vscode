import * as vscode from 'vscode';
// import { ServerStore } from '../services/ServerStore';
import { ServerStore } from '../services/ServerStore';
import { ServerView } from '../views/ServerView';
import * as path from 'path';

export async function addDeployment(serverItem: ServerView, serverStore: ServerStore) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folders found.');
        return;
    }

    const items = workspaceFolders.map(folder => ({
        label: folder.name,
        description: folder.uri.fsPath,
        folderUri: folder.uri
    }));

    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a folder for deployment'
    });

    if (!selection) {
        return;
    }

    const applicationPath = selection.label;
    const applicationName = path.parse(applicationPath).name;

    vscode.window.showInformationMessage(
        `Deployment folder selected: ${applicationName}`
    );

    serverStore.addDeployment(serverItem.id, {
        serverId: serverItem.id,
        label: applicationName,
        path: applicationPath
    });
}

export function registerAddDeployment(context: vscode.ExtensionContext, serverStore: ServerStore) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'websphere.addDeployment',
            (serverItem: ServerView) => addDeployment(serverItem, serverStore)
        )
    );
}
