import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { ApplicationDescriptor, AssemblyDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';
import { DescriptorTreeItem } from './DescriptorTreeItem';


// this class represents the UI element
export class Server extends DescriptorTreeItem {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public label: string,
        public readonly assemblyDescriptor?: AssemblyDescriptor,
        // public readonly descriptor?: ApplicationDescriptor,
        public readonly iconPath?: vscode.Uri) {
            super(name, vscode.TreeItemCollapsibleState.Expanded);
            this.id = id;
            this.contextValue = 'server';
            this.label = label;
            this.iconPath = iconPath;
}

    updateStatus(status: string) {
        this.label = `${this.name} (${status})`
    }
}


