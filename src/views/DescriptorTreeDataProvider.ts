import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { ApplicationDescriptor, AssemblyDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';
import { Server } from './Server'
import { EAR } from './EAR'
import { Module } from './Module'
import { DescriptorTreeItem } from './DescriptorTreeItem';



export class DescriptorTreeDataProvider implements vscode.TreeDataProvider<DescriptorTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<DescriptorTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private descriptorService: DescriptorService, public readonly iconPath?: vscode.Uri) {
        this.iconPath = iconPath;
        descriptorService.onDidChange(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(item: DescriptorTreeItem): vscode.TreeItem {
        return item;
    }

    getChildren(item?: DescriptorTreeItem): Thenable<DescriptorTreeItem[]> {
        const assemblyDescriptor = this.descriptorService.currentServerDescriptor;
        // if (!item) {
        //     // Root node
        //     return Promise.resolve([
        //         new Server(
        //         'Websphere Application Server 8.5',   // I'll leave this like this for now, but the user should be able to add the server runtime
        //         assemblyDescriptor,
        //         this.iconPath
        //         )
        //     ]);
        // }

        if (!item) {
            return Promise.resolve([])
        }

        if (item.isServer()) {
            item = item as Server;
            const assemblyDescriptor = this.descriptorService.currentServerDescriptor;    // change name later, this describes the server ear deployment
            const items = assemblyDescriptor.modules.map(
                app => {
                    app = (app as ApplicationDescriptor);
                    return new EAR(
                        app.id,
                        assemblyDescriptor,
                        app
                );
            }
        );
            return Promise.resolve(items);
        }

        if (item.isApplication()) {
            item = item as EAR;
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
