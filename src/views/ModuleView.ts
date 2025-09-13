import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { ApplicationDescriptor, AssemblyDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';
import { DescriptorTreeItem } from './DescriptorTreeItem';



export class Module extends DescriptorTreeItem {
  constructor(
    public readonly label: string,
    public readonly descriptor?: ModuleDescriptor,
  ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'module';
  }
  }