import * as vscode from 'vscode';



export type ServerStatus = 'unknown' | 'starting' | 'started' | 'stopping' | 'stopped';

export class ServerStatusManager {
    private byId = new Map<string, ServerStatus>();
    private _onDidChange = new vscode.EventEmitter<{ id: string; status: ServerStatus }>();
    readonly onDidChange = this._onDidChange.event;

    get(id: string): ServerStatus { return this.byId.get(id) ?? 'unknown'; }

    set(id: string, status: ServerStatus) {
        const prev = this.byId.get(id);
        if (prev === status) return;
        this.byId.set(id, status);
        this._onDidChange.fire({ id, status });
    }

    setStarting(id: string) { this.set(id, 'starting'); }
    setRunning(id: string)  { this.set(id, 'started'); }
    setStopping(id: string) { this.set(id, 'stopping'); }
    setStopped(id: string)  { this.set(id, 'stopped'); }
}
