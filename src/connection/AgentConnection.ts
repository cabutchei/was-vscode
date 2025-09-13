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

    async echo(): Promise<void> {
        const req: OutboundMessage = { type: 'request', id: uuid(), opcode: 'Echo' };
        await this.sendRequest(req, { timeoutMs: 1000 }).catch(
            () => { throw new Error('Disconnected')}
        );
    }

    async getServerInfo(path: string): Promise<InboundMessage> {
        const id = uuid();
        const req: ServerInfoRequest = {
            type: 'request', opcode: 'Server.Info', id: id,
            payload: { path: path }
        }
        return this.sendRequest(req, { timeoutMs: 5000 })
    }

    async addServer(serverId: string, serverPath: string): Promise<InboundMessage> {
        const id = uuid();
        const req: OutboundMessage = {
            type: 'request', opcode: 'Server.Add', version: this.negotiatedVersion,
            id, timestamp: Date.now(), payload: { id: serverId, path: serverPath }
        };
        return this.sendRequest(req, { timeoutMs: 5000 });
    }

    async serverStatus(): Promise<InboundMessage> {
        const id = uuid();
        const req: OutboundMessage = {
        type: 'request', opcode: 'Server.Status', version: this.negotiatedVersion, id, timestamp: Date.now(), payload: {}
        };
        return this.sendRequest(req, { timeoutMs: 5000 });
    }

    async startServer(serverId: string): Promise<InboundMessage> {
        const id = uuid();
        const req: OutboundMessage = {
            type: 'request', opcode: 'Server.Start', version: this.negotiatedVersion, id, timestamp: Date.now(), payload: { serverId }
        };
        return this.sendRequest(req, { timeoutMs: 20000 });
    }

    async stopServer(serverId: string): Promise<InboundMessage> {
        const id = uuid();
        const req: OutboundMessage = {
            type: 'request', opcode: 'Server.Stop', version: this.negotiatedVersion, id, timestamp: Date.now(), payload: { serverId }
        };
        return this.sendRequest(req, { timeoutMs: 20000 });
    }

    // async installApplication(): Promise<InboundMessage> {
    //     const id = uuid();
    //     const req: OutboundMessage = {
    //         type: 'request', opcode: 'Application.Install', version: this.negotiatedVersion, id, timestamp: Date.now(), payload: { serverId }
    //     };
    //     return this.sendRequest(req, { timeoutMs: 2000});
    // }

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
        const lines = this.consumeLines();
        for (let line of lines) {
            const msg: InboundMessage = this.parseMessage(line);
            logger.debug('RECV', msg);
            try {
                switch (msg.type) {
                    case 'response':
                        const pending = this.popPending(msg.id)!;
                        msg.success? pending.resolve(msg): pending.reject(new Error(msg?.error?.message));
                        break;
                    case 'event':
                        this._onEvent.fire(msg);
                }
            } catch (e:any) {
                logger.error('Failed to parse message', { line, error: e.message });
            }
        }
    }

    extract(key: string, msg: string) {
        new RegExp(`${key}`)
    }

    popPending(id: string) {
        if (id && this.pending.has(id)) {
            const pending = this.pending.get(id)!;
            clearTimeout(pending.timeout!);
            this.pending.delete(id);
            return pending;
        }
    }

    parseEcho(echo: string) {
        let rawMessage = JSON.parse(echo);
        if(!rawMessage.type) {
            throw new Error('Invalid message: missing type');
        }

        return rawMessage as InboundMessage
    }

    parseMessage(message: string): InboundMessage {
        let rawMessage = JSON.parse(message);
        if (!rawMessage?.type) {
            throw new Error('missing type property');
        }

        return rawMessage as InboundMessage;
    }

    *consumeLines() {
        let idx: number;
        while ((idx = this.buffer.indexOf('\n')) >= 0) {
        const raw = this.buffer.slice(0, idx).trim();
        this.buffer = this.buffer.slice(idx + 1);
        if (raw) {
            yield raw;
        }
        }
    }

}
