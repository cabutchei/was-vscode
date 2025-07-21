import * as cp from 'child_process';
import { logger } from '../util/logger';


export interface ITransport {
  write(raw: string): void;
  onData(cb: (chunk: string) => void): void;
  onClose(cb: (code?: number) => void): void;
  dispose(): void;
}

export class StdioTransport implements ITransport {
  private proc: cp.ChildProcess;
  private dataHandlers: Array<(c: string) => void> = [];
  private closeHandlers: Array<(code?: number) => void> = [];

  constructor(executable: string, args: string[] = []) {
    this.proc = cp.spawn(executable, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    this.proc.stdout?.setEncoding('utf8');
    this.proc.stdout?.on('data', d => this.dataHandlers.forEach(h => h(String(d))));
    this.proc.on('close', code => this.closeHandlers.forEach(h => h(code ?? undefined)));
    this.proc.stderr?.on('data', d => logger.warn('Agent STDERR', { d: String(d) }));
  }

  write(raw: string): void { this.proc.stdin?.write(raw); }
  onData(cb: (chunk: string) => void): void { this.dataHandlers.push(cb); }
  onClose(cb: (code?: number) => void): void { this.closeHandlers.push(cb); }
  dispose(): void { this.proc.kill(); }
}