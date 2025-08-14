import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path'
import { logger } from '../util/logger';

// this class deals directly with the server process

export class ServerProcessService {

    private output = vscode.window.createOutputChannel('WebSphere Server');
    private watchers = new Map<string, fs.FSWatcher>();
    private positions = new Map<string, number>();
    private procs = new Map<string, ChildProcess>();

    // launches the server and begins log file tailing
    async launch(serverId: string, javaPath: string, startScript: string, logFile: string): Promise<ChildProcess> {
        this.output.clear();
        this.output.show(true);
        this.output.appendLine(`> ${javaPath} ${startScript} ${serverId}`);
        // const proc = spawn(javaPath, [ startScript, serverId ], { cwd: path.dirname(startScript) });
        const args: string | undefined = vscode.workspace.getConfiguration('websphere').get('server.home');
        if (!args) {
            throw new Error('`websphere.server.home` must be set');
        }
        // javaPath = '/Users/cabutchei/.sdkman/candidates/java/current/bin/java';
        const proc = spawn(javaPath, [ '-cp', args, 'MockServer', serverId ], { cwd: path.dirname(args)});  // fails when I omit cwd. Why?
        this.procs.set(serverId, proc);
        proc.once('close', () => {
            this.procs.delete(serverId);
            this.stopTailing(serverId);
        });
        proc.on('error', e => this.output.appendLine(`✖ ${e.message}`));
        proc.on('close', code => {
            logger.info('why?');
            this.stopTailing(serverId);
            this.output.appendLine(code === 0? 'Server exited cleanly' : `Server exited with code ${code}`);
        });

        this.startTailing(serverId, logFile);
        return proc;
    }

    async stop(serverId: string, timeoutMs = 10_000): Promise<void> {
        const proc = this.procs.get(serverId);
        if (!proc || proc.killed) {
        this.output.appendLine(`No running process for server ${serverId}`);
        return;
        }

        this.output.appendLine(`Sending SIGTERM to server ${serverId} (pid ${proc.pid})`);

        proc.kill(process.platform === 'win32' ? 'SIGINT' : 'SIGTERM');

        // await exit or kill
        await new Promise<void>((resolve, reject) => {
        let finished = false;
        const onClose = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            this.output.appendLine(`Server ${serverId} exited gracefully`);
            resolve();
        };
        proc.once('close', onClose);

        const timeout = setTimeout(() => {
            if (finished) return;
            this.output.appendLine(`Server ${serverId} did not exit in ${timeoutMs}ms; sending SIGKILL`);
            proc.kill('SIGKILL');
            proc.once('close', () => {
            this.output.appendLine(`Server ${serverId} forcibly terminated`);
            resolve();
            });
        }, timeoutMs);
        });

        this.stopTailing(serverId);
        this.procs.delete(serverId);
  }

    private startTailing(id: string, filePath: string) {
        this.output.appendLine(`start tailing: ${filePath}`)
        fs.stat(filePath, (err, stats) => {
        const pos = err ? 0 : stats.size;
        this.positions.set(id, pos);
        try {
            const w = fs.watch(filePath, () => this.readNew(id, filePath));
            this.watchers.set(id, w);
        } catch {
            this.output.appendLine(`Cannot watch log file: ${filePath}`);
        }
        });
    }

    private readNew(id: string, filePath: string) {
        const prev = this.positions.get(id) ?? 0;
        fs.stat(filePath, (e,s) => {
            if (e || s.size <= prev) return;

            const rs = fs.createReadStream(filePath, { start: prev, end: s.size });
            let buf = '';
            rs.on('data', c => buf += c.toString());
            rs.on('end', () => {
                this.output.append(buf);
                this.positions.set(id, s.size);
            }
        );
    });
}

    private stopTailing(id: string) {
        this.watchers.get(id)?.close();
        this.watchers.delete(id);
        this.positions.delete(id);
    }
}
