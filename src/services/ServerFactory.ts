export interface Server {
    name: string;
    uniqueLabel: string;
    path: string;
    serverType: string;
    baseServerName: string;
    webSphereProfileName: string;
}


export class ServerFactory {

    public static create(name: string, uniqueLabel: string, path: string, serverType: string, baseServerName: string,
        webSphereProfileName: string): Server {
            return {
                name, uniqueLabel, path, serverType, baseServerName,
                webSphereProfileName
            }
        }
}