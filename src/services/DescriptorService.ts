import * as vscode from 'vscode';
import { ApplicationDescriptor, AssemblyDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';

// this class handles 

export class DescriptorService {
  private descriptor: AssemblyDescriptor = { serverId: '', modules: [] };
  private serverDescriptor: AssemblyDescriptor = { serverId: '', modules: [] }
  private emitter = new vscode.EventEmitter<AssemblyDescriptor>();
  readonly onDidChange = this.emitter.event;

  get current() { return this.descriptor; }

  get currentServerDescriptor() { return this.serverDescriptor; }

  updateServerInfo(serverId: string) {
    this.descriptor.serverId = serverId;
    this.emitter.fire(this.descriptor);
  }

  addModule(mod: ModuleDescriptor) {
    let modules = this.descriptor.modules as ModuleDescriptor[];
    modules.push(mod);
    this.emitter.fire(this.descriptor);
  }

  addApp(app: ApplicationDescriptor) {
    let modules = this.serverDescriptor.modules as ApplicationDescriptor[];
    modules.push(app);
    this.emitter.fire(this.serverDescriptor);
  }
}

