import * as net from 'net';
import { ITransport } from './Transport';
import { logger } from '../util/logger';


export class TcpTransport implements ITransport {
  private socket: net.Socket;
  private dataHandlers: Array<(chunk: string) => void> = [];
  private closeHandlers: Array<(code?: number) => void> = [];

  constructor(host: string, port: number) {
    this.socket = net.createConnection({ host, port }, () => {
      logger.info(`TCP connection established to ${host}:${port}`);
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
        this.socket.write(raw);
    }

    onData(cb: (chunk: string) => void): void {
        this.dataHandlers.push(cb);
    }

    onClose(cb: (code?: number) => void): void {
        this.closeHandlers.push(cb);
    }

    dispose(): void {
        this.socket.end();
    }
}
