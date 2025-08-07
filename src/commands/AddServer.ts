import * as vscode from 'vscode';


export function addServer(context: vscode.ExtensionContext) {
    const folder = vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select WebSphere Server Directory',
        title: 'Add WebSphere Server'
    });
}