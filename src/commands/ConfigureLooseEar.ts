import * as vscode from 'vscode';
import { DescriptorService } from '../services/DescriptorService';
import { ApplicationDescriptor, ModuleDescriptor } from '../models/AssemblyDescriptor';

// the goal here is to support loose deployment. The user will be able to configure the package structure and deployment assembly. I still need to deal
// with generating looseconfig files for websphere

export async function configureLooseEar(descriptorService: DescriptorService) {
    // a quickpick is like a dropdown menu, except it's permanently dropped
    const serverId = await vscode.window.showQuickPick(
        ['server1'],    // more servers in the future, maybe 
        { placeHolder: 'Select target WebSphere server' }
    );
    if (!serverId)  return
 
    descriptorService.updateServerInfo(serverId);

    const folders = vscode.workspace.workspaceFolders?.map(folder => folder.name) || [];
    const appId = await vscode.window.showQuickPick(
        folders, 
        { placeHolder: 'Select application' }
    );
    if (!appId) return;

    const application: ApplicationDescriptor = {
        id: appId,
        type: 'EAR',
        sourcePath: appId,
        contextRoot: "blah"
    }
    descriptorService.addApp(application);

    const moduleId = await vscode.window.showQuickPick(
        folders, 
        { placeHolder: 'Select module to add to EAR' }
    );
    if (!moduleId) return

    const type = await vscode.window.showQuickPick(
        ['EJB', 'WAR'],     // need to open up Eclipse and check if there are any other module types. I also need to deal with libraries later.
        { placeHolder: 'Select module type' }
    );
    if (!type) return

    let contextRoot: string | undefined;
    if (type === 'WAR') {
        contextRoot = await vscode.window.showInputBox({
        prompt: 'Enter context root (e.g. /app)',
        placeHolder: '/'
        });
    }

    const module: ModuleDescriptor = {
        id: moduleId,
        type: type as any,
        sourcePath: moduleId,
        contextRoot
    };
    descriptorService.addModule(module);

    vscode.window.showInformationMessage(
        `Added module ${moduleId} (${type})${contextRoot ? `${contextRoot}` : ''}`
    );
}

// export async function configureApplicationV(descriptorService: DescriptorService)


    export function registerConfigureLooseEar(context: vscode.ExtensionContext, descriptorService: DescriptorService) {
        context.subscriptions.push(
        vscode.commands.registerCommand(
            'websphere.configureLooseEar',
            () => configureLooseEar(descriptorService)
        )
    )
}
