import * as vscode from 'vscode';
import { AgentConnection } from '../connection/AgentConnection';
import { exec, spawn, ChildProcess, ChildProcessWithoutNullStreams } from 'child_process';
import { logger } from '../util/logger';



export interface SimpleState {
    connected: boolean;
}

export class SMSManager {
    private _connected: boolean = false;
    private emitter = new vscode.EventEmitter<Boolean>();
    private statusChangeEmitter = new vscode.EventEmitter<String>();
    private conn: AgentConnection;
    private scheduler: NodeJS.Timeout | undefined;
    private serverProcess: ChildProcessWithoutNullStreams | ChildProcess | undefined;
    private readonly probeInterval: number = 3 * 60 * 1000;
    readonly onReady = this.emitter.event;
    readonly onStatusChange = this.statusChangeEmitter.event;
    private dataEventEmitter = new vscode.EventEmitter<string>();
    public readonly onData = this.dataEventEmitter.event;

    constructor(conn: AgentConnection) {
        this.conn = conn;
    }

    async init() {
        return this.startServer();
    }

    public setConnected(connected: boolean) {
        this._connected = connected;
        this.emitter.fire(connected);
    }


    public isConnected() {
        return this._connected;
    }

    private async probeConnection() {
        await this.conn.echo().catch(
            () => {
                this.setConnected(false);
                this.emitter.fire(this.isConnected());
            });
    }

    public cancelProbeScheduler() {
        clearInterval(this.scheduler);
    }

    public async startServer() {
        const cwd = "C:\\Users\\c159688\\Documents\\vs_code\\was-vscode-project\\was-management-server";
        const javaPath = "C:\\Users\\c159688\\jdk-21.0.6\\bin\\java.exe";
        const jarFile = "was-management-server.jar";
        // let proc = spawn(javaPath, ['-jar', jarFile], { cwd: cwd, stdio: 'pipe' });
        let proc = spawn(javaPath, ['-version'], { cwd: cwd, stdio: 'pipe' });
        let pid = proc.pid? proc.pid : "unknown";
        logger.info(pid.toString())
        proc.stdout.on('data', (chunk) => {
            let data = String(chunk);
            this.dataEventEmitter.fire(data);
            this.emitter.fire(true);
            if (data.includes('listening')) this.statusChangeEmitter.fire('Connected');
        });
        setTimeout(() => proc.stdout.emit('data', 'listening'), 2000);
        this.serverProcess = proc;
        return new Promise<void>((resolve) => { this.onReady(() => resolve()) });
}

    public async stopServer() {
        if (!this.serverProcess) return;
        this.serverProcess.kill();
        // this.serverProcess.stdout.on(
        //   'data', (data) => {console.log(data)}
        // )
    }

    async ensureConnected(timeoutMs: number, backoff: number) {
        if (this.isConnected()) { return; }
        await this.sleep(2000).then(
            async () => {
                // await this.startServer();
                let startTime = Date.now();
                let currentTime;
                while (true) {
                    try {
                        await this.probeConnection();
                        this.setConnected(true);
                        break;
                    } catch(e) {
                        currentTime = Date.now();
                        if (currentTime - startTime > timeoutMs) {
                            throw new Error('Timed out trying to connect')
                        }
                        await this.sleep(backoff);
                    }
                }
            });
    }

    async sleep(millisecs: number) {
        return new Promise((resolve) => setTimeout(resolve, millisecs));
    }
}
