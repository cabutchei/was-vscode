// defines what the messages look like

export interface HandshakeRequest {
    type: 'request';
    opcode: 'Handshake.Request';
    version: number;           // envelope version field (client proposal)
    id: string;                // correlation id
    payload: { supported: number[] }; // e.g. [1]
    timestamp: number;
}


export interface HandshakeResponse {
    type: 'response';
    opcode: 'Handshake.Request';
    version: number;
    id: string;
    success: boolean;
    payload?: { selected: number };
    error?: { code: string; message: string };
    timestamp: number;
}

export interface ServerInfoRequest {
    type: 'request';
    opcode: 'Server.Info';
    id: string;
    payload: { path: string }
}

export interface ServerInfoResponse {
    type: 'response';
    opcode: 'Server.Info';
    version: number; // protocol version
    id: string;
    payload: ServerInfoResponsePayload;
    success: boolean;
    error?: { code: string; message: string };
    timestamp: number;
}

export interface ServerInfoResponsePayload {
    id: string;
    name: string;
    version: string;
    servers: string[];
    profiles: string[];
}

export interface ServerStatusRequest {
    type: 'request';
    opcode: 'Server.Status';
    version: number;
    id: string;
    payload: { };
    timestamp: number;
}


export interface ServerStatusResponse {
    type: 'response';
    opcode: 'Server.Status';
    version: number;
    id: string;
    success: boolean;
    payload?: { state: string; details?: any };
    error?: { code: string; message: string };
    timestamp: number;
}


export interface StartApplicationRequest {
    type: 'request';
    opcode: 'Application.Start';
    version: number;
    id: string;
    payload?: {
        applicationId: string
    };
    error?: {
        code: string;
        message: string
    };
    timestamp: number;
}

export interface StopApplicationRequest {
    type: 'request';
    opcode: 'Application.Stop';
    version: number;
    id: string;
    payload?: {
        applicationId: string
    };
    error?: {
        code: string;
        message: string
    };
    timestamp: number;
}


export type OutboundMessage = HandshakeRequest | ServerInfoRequest | ServerStatusRequest | StartApplicationRequest | StopApplicationRequest;
export type InboundMessage = HandshakeResponse | ServerInfoResponse | ServerStatusResponse | { type: 'event'; opcode: string; version: number; id?: string; timestamp: number; payload: any };

export interface RequestOptions { timeoutMs?: number; }
