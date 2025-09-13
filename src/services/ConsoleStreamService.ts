import * as vscode from 'vscode';
import { SMSManager } from './SMSManager';


export class ConsoleStreamService {

    private console = vscode.window.createOutputChannel('WebSphere Application Server');

    constructor(private smsManager: SMSManager) {
        this.smsManager.onData(
            (chunk) => this.writeToOutput(String(chunk))
        )
    }

    public writeToOutput(data: string) {
        this.console.appendLine(Date.toString());
    }
}