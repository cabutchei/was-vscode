import * as vscode from 'vscode';

export class Server extends vscode.TreeItem {
    status = Object.freeze({
        STOPPED: "(Stopped)",
        STOPPING: "(Stopping)",
        STARTING: "(Starting)",
        STARTED: "(Started)"
    })
    constructor(
        public readonly label: string,
        public running: boolean
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'server';
        this.description = running ? this.status.STARTED: this.status.STOPPED;
    }
}

export class ServerProvider implements vscode.TreeDataProvider<Server> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Server | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private servers: Server[] = [
        new Server('Websphere', false)
    ];

    getTreeItem(element: Server): vscode.TreeItem {
        return element;
    }

    getChildren(): Server[] {
        return this.servers;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }
}
