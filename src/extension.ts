import * as vscode from 'vscode';
import { ITransport, StdioTransport } from './connection/Transport';
import { TcpTransport } from './connection/TcpTransport';
import { AgentConnection } from './connection/AgentConnection';
import { Store } from './services/Store';
import { logger, LogLevel } from './util/logger';
import { DescriptorService } from './services/DescriptorService';
import { CommandService } from './services/CommandService';
import { ServerProcessService } from './services/ServerProcessService';
import { DescriptorTreeDataProvider } from './views/DescriptorTreeDataProvider';
import { registerConfigureLooseEar } from './commands/ConfigureLooseEar';
import { registerStartServer } from './commands/StartServer';
import * as path from 'path';
import { addServer } from './commands/AddServer';



let statusItem: vscode.StatusBarItem;


export async function activate(ctx: vscode.ExtensionContext) {
    logger.setLevel(LogLevel.DEBUG);
    
    const serverProcessService = new ServerProcessService();
    const descriptorService = new DescriptorService();
    const store = new Store();
    vscode.commands.registerCommand(
        'websphere.addServer',
        async () => {
            try {
                    await addServer(ctx);
                    // if (descriptorService.hasServer(input)) {
                    //     return `Server with ID "${input}" already exists`;
                    // }
                    return null;
                }
            catch (e:any) {
                vscode.window.showErrorMessage(`Failed to add server: ${e.message}`);
            }
})
    registerConfigureLooseEar(ctx, descriptorService);
    vscode.commands.registerCommand(
        'websphere.stopServer',
        async () => {
            try {
                await commandService.stopServer(descriptorService.current.serverId);
                vscode.window.showInformationMessage('Server stopped.');
            } catch (e:any) {
                vscode.window.showErrorMessage(`Failed to stop server: ${e.message}`);
            }
        }
    );
    const treeProvider = new DescriptorTreeDataProvider(descriptorService, vscode.Uri.file(
        path.join(ctx.extensionPath, 'resources', 'websphere.png')));
    const treeView = vscode.window.createTreeView('websphere', {
            treeDataProvider: treeProvider,
            showCollapseAll: true
        }
    );
            statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
            statusItem.text = 'WebSphere: starting…';
            statusItem.show();
            ctx.subscriptions.push(treeView);
            ctx.subscriptions.push(statusItem);
            
            const cfg = vscode.workspace.getConfiguration('websphere');
            const transportMode = cfg.get<string>('agent.transport');
            let transport: ITransport;
            
            if (transportMode === 'tcp') {
                const host = cfg.get<string>('agent.host')!;
                const port = cfg.get<number>('agent.port')!;
                transport = new TcpTransport(host, port);
            } else {
                const agentPath = cfg.get<string>('agent.executablePath')!;
                transport = new StdioTransport(agentPath);
            }
            
            const conn = new AgentConnection(transport);
            
            const commandService = new CommandService(conn, store, serverProcessService);
            registerStartServer(ctx, commandService, descriptorService);

            
            store.onDidChange(s => {
                const state = s.serverState ?? 'Unknown';   // need to make an enum with these states
                const connTxt = s.connected ? 'Connected' : 'Disconnected';
                statusItem.text = `WebSphere: ${state} (${connTxt})`;
                statusItem.tooltip = `Last checked: ${s.lastChecked ? new Date(s.lastChecked).toLocaleTimeString() : '—'}`;
            });
            
            vscode.commands.registerCommand('websphere.refreshStatus', async () => {
                try {
                    await commandService.refreshServerStatus();
                } catch (e:any) {
                    vscode.window.showErrorMessage('Failed to refresh server status: ' + e.message);
                }
            });
            
            statusItem.command = 'websphere.refreshStatus';
            
    try {
        await commandService.initialize();
        await commandService.refreshServerStatus();
    } catch (e:any) {
        vscode.window.showErrorMessage('WebSphere agent initialization failed: ' + e.message);
        store.update({serverState: "Unknown"})
    }
}

export function deactivate() {
  // nothing yet; transport will die with process
}