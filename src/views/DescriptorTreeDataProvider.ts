import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { AssemblyDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';

// this class represents the UI element
export class DescriptorTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly descriptor?: AssemblyDescriptor,
    public readonly module?: ModuleDescriptor
  ) {
    super(label, collapsibleState);
    if (module) {
      this.contextValue = 'module';
      this.description = module.type + (module.contextRoot ? ` @ ${module.contextRoot}` : '');
    } else {
      this.contextValue = 'server';
      this.description = descriptor?.serverId;
    }
  }

    isServer(): boolean {
        return this.contextValue === 'server';
    }

    hasDescriptor(): boolean {
        return Boolean(this.descriptor);
    }
}


export class DescriptorTreeDataProvider implements vscode.TreeDataProvider<DescriptorTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<DescriptorTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private descriptorService: DescriptorService) {
        descriptorService.onDidChange(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(item: DescriptorTreeItem): vscode.TreeItem {
        return item;
    }

    getChildren(item?: DescriptorTreeItem): Thenable<DescriptorTreeItem[]> {
        const desc = this.descriptorService.current;
        if (!item) {
            // Root node
            return Promise.resolve([
                new DescriptorTreeItem(
                'Websphere Application Server 8.5',   // I'll leave this like this for now, but the user should be able to add the server runtime
                vscode.TreeItemCollapsibleState.Expanded,
                desc
                )
            ]);
        }

        if (item.isServer() && item.descriptor) {
            const items = item.descriptor.modules.map(
                module => {
                    return new DescriptorTreeItem(
                        module.id,
                        vscode.TreeItemCollapsibleState.None,
                        undefined,
                        module
                )
            }
        );
            return Promise.resolve(items);
        }
        
        return Promise.resolve([]);
    }
}
