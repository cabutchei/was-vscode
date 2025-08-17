import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { CommandService } from '../services/CommandService';
import * as serverView from '../views/Server';

// trying my best to implement separation of concerns

export async function startServer(serverItem: serverView.Server, commandService: CommandService, descriptorService: DescriptorService) {
    const serverId = serverItem.id;
    try{
        commandService.streamLogs(serverId);
        commandService.startServer(serverId);
        vscode.window.showInformationMessage('Server started.');
    } catch (err:any) {
        vscode.window.showErrorMessage(`Failed to start server: ${err.message}`);
    }
}


export function registerStartServer(context: vscode.ExtensionContext, commandService: CommandService, descriptorService: DescriptorService) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'websphere.startServer',
            (serverItem: serverView.Server) => {
                startServer(serverItem, commandService, descriptorService)
            }
        )
    )
}


export function registerStopServer(context: vscode.ExtensionContext, commandService: CommandService, descriptorService: DescriptorService) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'websphere.stopServer',
            async (serverItem: serverView.Server) => {
                const serverId = serverItem.id;
                try {
                    await commandService.stopServer(serverId);
                    vscode.window.showInformationMessage('Server stopped.');
                } catch (e:any) {
                    vscode.window.showErrorMessage(`Failed to stop server: ${e.message}`);
                }
            }
        )
    )
}