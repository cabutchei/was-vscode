import * as vscode from 'vscode';
import * as net from 'net';
import { ITransport } from './Transport';
import { logger } from '../util/logger';


enum ReadyState {
  CONNECTED = 'open',
  DISCONNECTED = 'disconnected'
}

export class TcpTransport implements ITransport {
    private socket: net.Socket | undefined;
    private dataHandlers: Array<(chunk: string) => void> = [];
    private closeHandlers: Array<(code?: number) => void> = [];
    private emitter = new vscode.EventEmitter<void>();
    public onConnected = this.emitter.event;

    constructor(private readonly host: string, private readonly port: number) {}

    connect(): void {
        this.socket = net.createConnection({ host: this.host, port: this.port }, () => {
          logger.info(`TCP connection established to ${this.host}:${this.port}`);
          this.emitter.fire();
        });
    
        this.socket.setEncoding('utf8');
    
        this.socket.on('data', d => {
          this.dataHandlers.forEach(h => h(String(d)));
        });
    
        this.socket.on('close', () => {
          this.closeHandlers.forEach(h => h());
        });
    
        this.socket.on('error', err => {
          logger.error('TCP socket error', { error: err.message });
        });

    }


    write(raw: string): void {
        if (!this.socket) return;
        this.socket.write(raw);
    }

    onData(cb: (chunk: string) => void): void {
        this.dataHandlers.push(cb);
    }

    onClose(cb: (code?: number) => void): void {
        this.closeHandlers.push(cb);
    }

    dispose(): void {
        if (!this.socket) return;
        this.socket.end();
    }

    get connected() {
      if (!this.socket || this.socket.readyState !== ReadyState.CONNECTED) {
        return false;
      }
      return true;
    }
}
