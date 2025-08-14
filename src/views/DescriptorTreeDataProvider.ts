import * as vscode from 'vscode';
import * as path from 'path';
import { DescriptorService } from '../services/DescriptorService';
import { ApplicationDescriptor, AssemblyDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';
import { Server } from './Server'
import { Application } from './EAR'
import { Module } from './Module'
import { DescriptorTreeItem } from './DescriptorTreeItem';
import { ServerStore } from '../services/ServerStore';



export class DescriptorTreeDataProvider implements vscode.TreeDataProvider<DescriptorTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<DescriptorTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private serverElements = new Map<string, Server>();
    private newServer: string | null;

    constructor(private context: vscode.ExtensionContext, private descriptorService: DescriptorService, private serverStore: ServerStore, public readonly iconPath?: vscode.Uri) {
        this.context = context;
        this.iconPath = iconPath;
        this.serverStore = serverStore;
        descriptorService.onDidChange(() => this.refresh());
        serverStore.onDidChange((e) => {
            const element = this.serverElements.get(e.id);
            this.newServer = e.id;
            // If we already have a node for this server, refresh just that node;
            // otherwise, refresh the root so it appears.
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
                const server = this.serverStore.getServer(this.newServer);
                const serverType = this.serverStore.getServerType(this.newServer);
                let iconPath: vscode.Uri | undefined;

                if(!serverType) {   // TODO: handle this better
                    return Promise.resolve([]);
                }

                if(serverType?.icon) {
                    iconPath = vscode.Uri.file(
                        path.join(this.context.extensionPath, serverType.icon)
                    );
                }

                if (!server) {
                    return Promise.resolve([]);
                }

                this.newServer = null;

                const newServerView = new Server(
                    server.id,
                    server.name,
                    assemblyDescriptor,
                    iconPath
                );
                return Promise.resolve([newServerView]);
        } else {
            return Promise.resolve([]);
        }
    }

        if (item.isServer()) {
            item = item as Server;
            const assemblyDescriptor = this.descriptorService.currentServerDescriptor;    // change name later, this describes the server ear deployment
            const items = assemblyDescriptor.modules.map(
                app => {
                    app = (app as ApplicationDescriptor);
                    return new Application(
                        app.id,
                        assemblyDescriptor,
                        app
                );
            }
        );
            return Promise.resolve(items);
        }

        if (item.isApplication()) {
            item = item as Application;
            const assemblyDescriptor = this.descriptorService.current
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
