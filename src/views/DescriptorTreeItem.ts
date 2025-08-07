import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { ApplicationDescriptor, AssemblyDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';
import { Server } from './Server'


export class DescriptorTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
    }
    isServer(): boolean {
        return this.contextValue === 'server';
    }
  
    isApplication(): boolean {
        return this.contextValue === 'application';
    }
} 