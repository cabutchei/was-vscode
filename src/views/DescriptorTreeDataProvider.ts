import * as vscode from 'vscode';
import * as path from 'path';
import { DescriptorService } from '../services/DescriptorService';
import { ApplicationDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';
import { ServerView } from './ServerView'
import { ApplicationView } from './ApplicationView'
import { Module } from './ModuleView'
import { DescriptorTreeItem } from './DescriptorTreeItem';
import { ServerStore } from '../services/ServerStore';
import { ServerTypes } from '../services/ServerTypes';



export class DescriptorTreeDataProvider implements vscode.TreeDataProvider<DescriptorTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<DescriptorTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private serverElements = new Map<string, ServerView>();
    private newServer: string | null;

    constructor(private context: vscode.ExtensionContext, private descriptorService: DescriptorService, private serverStore: ServerStore, public readonly iconPath?: vscode.Uri) {
        this.context = context;
        this.iconPath = iconPath;
        Array.from(this.serverStore.getServerMap().keys())
            .forEach(id => {
                const server = this.serverStore.getServer(id);
                if (!server) return;
                const serverView = new ServerView(
                    id,
                    server.uniqueLabel,
                    server.uniqueLabel,
                    iconPath
                );
                serverView.updateStatus('unknown');
                this.serverElements.set(id, serverView);
            }
        );

        serverStore.onAddServer((e) => {
            const element = this.serverElements.get(e.id);
            if (element) {
                element.updateStatus(serverStore.getServerStatus(e.id));
            } else {
                this.newServer = e.id;
            }
            this.newServer = e.id;
            this._onDidChangeTreeData.fire(element ?? undefined);
        }
    );
    this.newServer = null;
}

    refresh(element?: DescriptorTreeItem): void {
        this._onDidChangeTreeData.fire(element);
    }

    getTreeItem(item: DescriptorTreeItem): vscode.TreeItem {
        return item;
    }

    getChildren(item?: DescriptorTreeItem): Thenable<DescriptorTreeItem[]> {
        const assemblyDescriptor = this.descriptorService.currentServerDescriptor;
        if (this.serverStore.empty()) {
            return Promise.resolve([])
        }

        if (!item) {
            if (this.newServer) {

                const serverId = this.newServer;
                this.newServer = null;
                const server = this.serverStore.getServer(serverId);
                if (!server) return Promise.resolve([]);

                let iconPath = vscode.Uri.file(
                    path.join(
                        this.context.extensionPath, ServerTypes.getIconForServer(server.serverType)
                    )
                );

                const newServerView = new ServerView(
                    serverId,
                    server.uniqueLabel,
                    server.uniqueLabel,
                    iconPath
                );
                this.serverElements.set(serverId, newServerView);
                newServerView.updateStatus(this.serverStore.getServerStatus(serverId));
                return Promise.resolve(
                    Array.from(this.serverElements.values())
                );
            } else {
                let el = this.serverElements.values().next().value as ServerView    // TODO: how do I get the right server?
                if (!el) {
                    return Promise.resolve([]);
                }
                return Promise.resolve([el]);
            }
        }

            if (item.isServer()) {
                item = item as ServerView;
                const assemblyDescriptor = this.descriptorService.currentServerDescriptor;    // change name later, this describes the server ear deployment
                const items = assemblyDescriptor.modules.map(
                    app => {
                        app = (app as ApplicationDescriptor);
                        return new ApplicationView(
                            app.id,
                            assemblyDescriptor,
                            app
                    );
                }
            );
                return Promise.resolve(items);
            }

            if (item.isApplication()) {
                item = item as ApplicationView;
                const assemblyDescriptor = this.descriptorService.current;
                const items = assemblyDescriptor.modules.map(
                    module => {
                        module = (module as ModuleDescriptor)
                        return new Module(
                            module.id,
                            module
                        )
                    }
                );
                return Promise.resolve(items);
            }

            return Promise.resolve([]);
        }
}
