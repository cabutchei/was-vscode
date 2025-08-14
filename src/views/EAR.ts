import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { ApplicationDescriptor, AssemblyDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';
import { DescriptorTreeItem } from './DescriptorTreeItem';



export class Application extends DescriptorTreeItem {
  constructor(
    public readonly label: string,
    public readonly assemblyDescriptor?: AssemblyDescriptor,
    public readonly descriptor?: ApplicationDescriptor,
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'application';
    this.description = assemblyDescriptor?.serverId;
    }
  }