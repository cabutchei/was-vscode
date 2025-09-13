import * as vscode from 'vscode';
import { AgentConnection } from '../connection/AgentConnection';
import { InboundMessage, ServerInfoResponse, ServerInfoResponsePayload, ServerStatusResponse } from '../protocol/messages';
import { ServerStore } from './ServerStore';



export class NotificationService {

    private _onEvent = new vscode.EventEmitter<Object>();
    public readonly onEvent = this._onEvent.event;



    constructor(
        private conn: AgentConnection,
        private serverStore: ServerStore
    ) {
        this.conn.onEvent((e) => this.handleEvent(e));
    }

    async handleEvent(message: InboundMessage) {
        if (message.type !== 'event') {
            return;
        }

        // let serverId = this.serverStore.getServers()[0].id  // TODO: how do I get the right server?
        let serverId = this.serverStore.getServerMap().keys().next().value;
        if (!serverId) return;
        switch(message.opcode) {
            case 'j2ee.state.starting':
                this.serverStore.setStarting(serverId);
                break;
            case 'j2ee.state.running':
                this.serverStore.setRunning(serverId);
                break;
            case 'j2ee.state.stopping':
                this.serverStore.setStopping(serverId);
                break;
            case 'j2ee.state.stopped':
                this.serverStore.setStopped(serverId);
                break;
            case 'j2ee.state.failed':
                this.serverStore.setFailed(serverId);
                break;

        }

    }

}