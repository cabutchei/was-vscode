import * as vscode from 'vscode';
import { ServerProvider, Server } from './serverTree';

export function activate(context: vscode.ExtensionContext) {
    const provider = new ServerProvider();
    vscode.window.registerTreeDataProvider('was', provider);

    context.subscriptions.push(
        vscode.commands.registerCommand('was.start', (server: Server) => {
            vscode.window.showInformationMessage(`Starting ${server.label}`);
            server.running = true;
            server.description = server.status.STARTED
            provider.refresh();
        }),

        vscode.commands.registerCommand('was.stop', (server: Server) => {
            vscode.window.showInformationMessage(`Stopping ${server.label}`);
            server.running = false;
            server.description = server.status.STOPPED
            provider.refresh();
        })
    );
}
