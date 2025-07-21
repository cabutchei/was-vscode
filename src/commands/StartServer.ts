import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { ModuleDescriptor } from '../models/AssemblyDescriptor';
import { CommandService } from '../services/CommandService';

// trying my best to implement separation of concerns

export async function startServer(commandService: CommandService, descriptorService: DescriptorService) {
    const serverId = descriptorService.current.serverId;
    try{
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Starting server…' },
                () => commandService.startServer(serverId)
            );
        vscode.window.showInformationMessage('Server started.');
    } catch (err:any) {
        vscode.window.showErrorMessage(`Failed to start server: ${err.message}`);
    }
    descriptorService.updateServerInfo(serverId);

}


export function registerStartServer(context: vscode.ExtensionContext, commandService: CommandService, descriptorService: DescriptorService) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'websphere.startServer',
            () => startServer(commandService, descriptorService)
        )
    )
}