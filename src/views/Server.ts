import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { ApplicationDescriptor, AssemblyDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';
import { DescriptorTreeItem } from './DescriptorTreeItem';


// this class represents the UI element
export class Server extends DescriptorTreeItem {
  constructor(
    public readonly label: string,
    public readonly assemblyDescriptor?: AssemblyDescriptor,
    // public readonly descriptor?: ApplicationDescriptor,
    public readonly iconPath?: vscode.Uri
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'server';
    // this.description = assemblyDescriptor?.serverId;
    this.iconPath = iconPath;
    }
}


