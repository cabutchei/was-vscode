import * as vscode from 'vscode';

// maintain state and notify

export interface SimpleState {
  connected: boolean;
  serverState?: string;
  lastChecked?: number;
}

export class SMStore {
  private state: SimpleState = { connected: false };
  private emitter = new vscode.EventEmitter<SimpleState>();
  readonly onDidChange = this.emitter.event;

  get snapshot(): SimpleState { return this.state; }

  update(patch: Partial<SimpleState>) {
    this.state = { ...this.state, ...patch };
    this.emitter.fire(this.state);
  }
}