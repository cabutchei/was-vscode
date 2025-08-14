import * as vscode from 'vscode';
import { v4 as uuid } from 'uuid';
import { HandshakeResponse, InboundMessage, OutboundMessage, RequestOptions, ServerInfoRequest } from '../protocol/messages';
import { logger } from '../util/logger';
import { ITransport } from './Transport';


interface Pending {
    resolve: (msg: InboundMessage) => void;
    reject: (err: Error) => void;
    timeout?: NodeJS.Timeout;
}

export class AgentConnection {
    private buffer = '';
    private pending = new Map<string, Pending>();
    private negotiatedVersion = 1;
    private connected = false;
    private _onEvent = new vscode.EventEmitter<InboundMessage>();
    public readonly onEvent = this._onEvent.event;

    constructor(private transport: ITransport) {
        transport.onData(data => this.onData(data));
        transport.onClose(code => {
        this.connected = false;
        logger.warn('Transport closed', { code });
        for (const [id, p] of this.pending) {
            p.reject(new Error('Connection closed'));
            this.pending.delete(id);
        }
        });
    }

    async handshake(): Promise<void> {
        const id = uuid();
        const req: OutboundMessage = {
        type: 'request', opcode: 'Handshake.Request', version: 1, id, timestamp: Date.now(),
        payload: { supported: [1] }
        };
        const resp = await this.sendRequest(req, { timeoutMs: 5000 }) as HandshakeResponse
        if (resp.type !== 'response' || !('payload' in resp) || !resp.success) {
            throw new Error('Handshake failed');
        }
        this.negotiatedVersion = (resp as any).payload.selected;
        this.connected = true;
        logger.info('Handshake success', { version: this.negotiatedVersion });
    }

    async getServerInfo(path: string): Promise<InboundMessage> {
        const id = uuid();
        const req: ServerInfoRequest = {
            type: 'request', opcode: 'Server.Info', id: id,
            payload: { path: path }
        }
        return this.sendRequest(req, { timeoutMs: 5000 })
    }

    async serverStatus(): Promise<InboundMessage> {
        const id = uuid();
        const req: OutboundMessage = {
        type: 'request', opcode: 'Server.Status', version: this.negotiatedVersion, id, timestamp: Date.now(), payload: {}
        };
        return this.sendRequest(req, { timeoutMs: 5000 });
    }

    async startAplication(): Promise<InboundMessage> {
        const id = uuid();
        const req: OutboundMessage = {
            type: 'request', opcode: 'Application.Start', version: this.negotiatedVersion, id, timestamp: Date.now(), payload: { applicationId: "silce"}
        };
        return this.sendRequest(req, { timeoutMs: 500});
    }

    async stopApplication(): Promise<InboundMessage> {
        const id = uuid();
        const req: OutboundMessage = {
            type: 'request', opcode: 'Application.Stop', version: this.negotiatedVersion, id, timestamp: Date.now(), payload: { applicationId: "silce"}
        };
        return this.sendRequest(req, { timeoutMs: 500});
    }

    private sendRequest(msg: OutboundMessage, opts: RequestOptions): Promise<InboundMessage> {
        return new Promise((resolve, reject) => {
        const str = JSON.stringify(msg) + '\n';
        logger.debug('SEND', msg);
        this.transport.write(str);
        const timeout = setTimeout(() => {
            this.pending.delete(msg.id!);
            reject(new Error(`Request timeout: ${msg.opcode}`));
        }, opts.timeoutMs ?? 10000);
        this.pending.set(msg.id!, { resolve, reject, timeout });
        });
    }

    private onData(chunk: string) {
        this.buffer += chunk;
        let idx: number;
        while ((idx = this.buffer.indexOf('\n')) >= 0) {
        const raw = this.buffer.slice(0, idx).trim();
        this.buffer = this.buffer.slice(idx + 1);
        if (!raw) continue;
        try {
            const msg: InboundMessage = JSON.parse(raw);
            logger.debug('RECV', msg);
            switch (msg.type) {
                case 'response':
                    if (msg.id && this.pending.has(msg.id)) {
                        const pending = this.pending.get(msg.id)!;
                        clearTimeout(pending.timeout); pending.resolve(msg); this.pending.delete(msg.id);
                    }
                    break;
                case 'event':
                    this._onEvent.fire(msg);

            }
        } catch (e:any) {
            logger.error('Failed to parse message', { raw, error: e.message });
        }
        }
    }
}
