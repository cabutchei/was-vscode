import { AgentConnection } from '../connection/AgentConnection';
import { Store } from './Store';
import { InboundMessage } from '../protocol/messages';



export class NotificationService {
  constructor(
    private conn: AgentConnection,
    private store: Store
  ) {
    conn.onEvent(this.handleEvent.bind(this));
  }

  private handleEvent(msg: InboundMessage) {
    switch (msg.opcode) {
      case 'Server.StateChanged':
        this.store.update({ serverState: msg.payload.newState });
        break;
      // ...other notifications...
    }
  }
}
