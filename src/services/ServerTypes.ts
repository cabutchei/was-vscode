
export namespace ServerTypes {

    export const WASNDV85 = "com.ibm.websphere.ND.v85";

    export const WASBASEV85 = "com.ibm.websphere.BASE.v85";

    export const WASNDV80 = "com.ibm.websphere.ND.v80";

    export const WASBASEV80 = "com.ibm.websphere.BASE.v80";


    export function getIconForServer(serverType: string) {
        return "resources/websphere.png";
    }

    export function getLabelForServer(serverType: string) {
        switch (serverType) {
            case WASBASEV80:
            case WASNDV80:
                return "WebSphere Application Server 8.0";
            case WASBASEV85:
            case WASNDV85:
                return "WebSphere Application Server 8.5";
            default:
                return "Websphere Application Server";
        }
    }
}
