import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { Server, ServerStore } from '../services/ServerStore';
import { CommandService } from '../services/CommandService';
import { v4 as uuid } from 'uuid';
import { ServerTypes } from '../services/ServerTypes';



export async function addDeployment() {
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

    vscode.window.showInformationMessage(`Deployment folder selected: ${selection.label}`);
}