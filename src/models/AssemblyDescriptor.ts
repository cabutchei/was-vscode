export interface ApplicationDescriptor {
  id: string;
  type: 'EAR';
  sourcePath: string;
  contextRoot?: string;
}
export interface ModuleDescriptor {
  id: string
  type: 'EJB'|'WAR';
  sourcePath: string;
  contextRoot?: string;
}

export interface AssemblyDescriptor {
  serverId: string;
  modules: ApplicationDescriptor[] | ModuleDescriptor[];
}
