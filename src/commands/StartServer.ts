import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { ModuleDescriptor } from '../models/AssemblyDescriptor';
import { CommandService } from '../services/CommandService';
import * as serverView from '../views/Server';

// trying my best to implement separation of concerns

export async function startServer(serverItem: serverView.Server, commandService: CommandService, descriptorService: DescriptorService) {
    // const serverId = descriptorService.current.serverId;
    const serverId = serverItem.id;
    try{
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Starting server…' },
                async () => commandService.startServer(serverId)
            );
        vscode.window.showInformationMessage('Server started.');
    } catch (err:any) {
        vscode.window.showErrorMessage(`Failed to start server: ${err.message}`);
    }
    // descriptorService.updateServerInfo(serverId);

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