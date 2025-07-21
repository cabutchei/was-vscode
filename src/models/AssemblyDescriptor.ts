export interface ModuleDescriptor {
  id: string
  type: 'EJB'|'WAR';
  sourcePath: string;
  contextRoot?: string;
}

export interface AssemblyDescriptor {
  serverId: string;
  modules: ModuleDescriptor[];
}
