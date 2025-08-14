import * as vscode from 'vscode';



export interface ServerType {
    id: string,
    name: string,
    label: string
    version: string
    icon?: string;
}


// meant to translate websphere server description
export class ServerTypes {

    private static serverTypes: ServerType[] = [
        {
            id: 'ND',
            name: 'IBM WebSphere Application Server Network Deployment',
            label: 'Websphere 8.5',
            version: '8.5.5',
            icon: 'resources/websphere.png' }
    ];

    static getAll(): ServerType[] {
        return this.serverTypes;
    }

    static get(id: string): ServerType | undefined {
        return this.serverTypes.find(type => type.id === id);
    }
}
