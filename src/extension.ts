import * as vscode from 'vscode';
import { ITransport, StdioTransport } from './connection/Transport';
import { TcpTransport } from './connection/TcpTransport';
import { AgentConnection } from './connection/AgentConnection';
import { SMSManager } from './services/SMSManager';
import { logger, LogLevel } from './util/logger';
import { DescriptorService } from './services/DescriptorService';
import { CommandService } from './services/CommandService';
import { ServerProcessService } from './services/ServerProcessService';
import { DescriptorTreeDataProvider } from './views/DescriptorTreeDataProvider';
import { registerConfigureLooseEar } from './commands/ConfigureLooseEar';
import { registerStartServer, registerStopServer } from './commands/StartServer';
import * as path from 'path';
import { addServer } from './commands/AddServer';
import { ServerStore } from './services/ServerStore';
import { ServerPersistence } from './services/ServerPersistence';
import { NotificationService } from './services/NotificationService';
import { registerAddDeployment } from './commands/AddDeployment';
import { ConsoleStreamService } from './services/ConsoleStreamService';



let statusItem: vscode.StatusBarItem;


export async function activate(ctx: vscode.ExtensionContext) {
    logger.setLevel(LogLevel.DEBUG);

    const storageUri = ctx.storageUri;
    if (!storageUri) {
        vscode.window.showErrorMessage('Open a folder/workspace first.');
        return;
    }

    const serverProcessService = new ServerProcessService();
    const descriptorService = new DescriptorService();
    const serverStore = new ServerStore();
    const serverPersistence = new ServerPersistence(ctx, serverStore);
    await serverPersistence.init();

    const treeProvider = new DescriptorTreeDataProvider(ctx, descriptorService, serverStore, vscode.Uri.file(
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
    const smsProcess = new SMSManager(conn);
    const consoleStreamService = new ConsoleStreamService(smsProcess);
    const commandService = new CommandService(conn, smsProcess, serverProcessService);

    const listener = new NotificationService(conn, serverStore);

    registerCommands(ctx, commandService, serverProcessService,
        descriptorService, smsProcess, serverStore,
        serverPersistence);

    smsProcess.init()
    .then(
        () => {
            transport.connect();
            transport.onConnected(() => {
                statusItem.text = 'SMServer: (Connected)';
                serverStore.getServerMap().forEach(
                    (server, id, _) => commandService.addServer(id, server.path)
                )
            })
            transport.onClose(() => {
                statusItem.text = 'SMServer: (Disconnected)';
            })
        }
    )
    .catch(
        () => {
            vscode.window.showErrorMessage('Server Management Server failed to start');
            statusItem.text = 'SMServer: (Disconnected)';
            throw new Error();
        }
    )

            
}

export function deactivate() {
  // nothing yet; transport will die with process
}


async function registerCommands(
    context: vscode.ExtensionContext,
    commandService: CommandService,
    serverProcessService: ServerProcessService,
    descriptorService: DescriptorService,
    serverManagementStore: SMSManager,
    serverStore: ServerStore,
    serverPersistence: ServerPersistence) {
        registerAddDeployment(context, serverStore);
        registerStartServer(context, commandService, descriptorService);
        registerStopServer(context, commandService, descriptorService);
        vscode.commands.registerCommand(
            'websphere.addServer',
            async () => {
                try {
                    await addServer(context, commandService, serverPersistence, serverStore);
                    return null
                } catch (err:any) {
                    vscode.window.showErrorMessage(`Failed to add server: ${err.message}`);
                }
            }
        )
        
    }