import * as vscode from 'vscode';
import { AssemblyDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';

// this class handles 

export class DescriptorService {
  private descriptor: AssemblyDescriptor = { serverId: '', modules: [] };
  private emitter = new vscode.EventEmitter<AssemblyDescriptor>();
  readonly onDidChange = this.emitter.event;

  get current() { return this.descriptor; }

  updateServerInfo(serverId: string) {
    this.descriptor.serverId = serverId;
    this.emitter.fire(this.descriptor);
  }

  addModule(mod: ModuleDescriptor) {
    this.descriptor.modules.push(mod);
    this.emitter.fire(this.descriptor);
  }
}

