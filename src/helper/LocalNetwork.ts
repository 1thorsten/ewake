import {localFormattedTime} from "./Helper";
import * as os from "os";
import {NetworkInterfaceInfo} from "os";

export type NetworkInterface = {
    name: string,
    address: string,
    netmask: string,
    broadcast: string
}

export class LocalNetwork {
    private static INSTANCE = new LocalNetwork();
    private defaultNetworkInterface: NetworkInterface | undefined = undefined;

    private constructor() {
    }

    public static get instance(): LocalNetwork {
        return LocalNetwork.INSTANCE;
    }

    /**
     * calculate the local broadcast address (differs between windows and linux; it is necessary for WOL)
     * @param {NetworkInterfaceInfo} addressInfo
     * @return {string} broadcast ipaddress
     */
    private static calculateBroadcast(addressInfo: NetworkInterfaceInfo): string {
        const addr_splitted: string[] = addressInfo.address.split('.');
        const netmask_splitted: string[] = addressInfo.netmask.split('.');
        // bitwise OR over the splitted NAND netmask, then glue them back together with a dot character to form an ip
        // we have to do a NAND operation because of the 2-complements; getting rid of all the 'prepended' 1's with & 0xFF
        return addr_splitted.map((e, i) => (~netmask_splitted[i] & 0xFF) | parseInt(e)).join('.');
    }

    /**
     * check whether the given interface (trimmed and lowercased) exists or not
     * @param rqName
     * @return NetworkInterface if interface exists OR string[] overview over all interfaces
     */
    public static identifyNetworkInterface(rqName?: string): string[] | NetworkInterface {
        const interfaces = os.networkInterfaces();
        const names: string[] = Object.keys(interfaces);
        if (rqName) {
            const interfaceName = rqName.trim().toLowerCase();
            if (names.indexOf(interfaceName) !== -1 && Array.isArray(interfaces[interfaceName]) && interfaces[interfaceName]!.length > 0) {
                const ipV4Interfaces: NetworkInterfaceInfo[] = (interfaces[interfaceName] as NetworkInterfaceInfo[]).filter(value => value.family === 'IPv4');
                if (ipV4Interfaces) {
                    return {
                        address: ipV4Interfaces[0].address,
                        name: interfaceName,
                        netmask: ipV4Interfaces[0].netmask,
                        broadcast: LocalNetwork.calculateBroadcast(ipV4Interfaces[0])
                    };
                }
            }
        }
        return names;
    }

    /**
     * determine default network interface
     * @return {NetworkInterface | undefined} default interface
     */
    public networkInterface(): NetworkInterface | undefined {
        if (this.defaultNetworkInterface) {
            return this.defaultNetworkInterface;
        }
        try {
            const interfaces = os.networkInterfaces();

            const suitableItem = (i: NetworkInterfaceInfo, index: number): any & NetworkInterfaceInfo | [] => {
                if (i.family === 'IPv4' &&
                    i.mac !== '00:00:00:00:00:00' &&
                    !i.mac.startsWith('02:42'/*docker*/) &&
                    !i.mac.startsWith('00:15:5d'/*Microsoft*/) &&
                    !i.internal) {
                    return {
                        'address': i.address,
                        'name': Object.keys(interfaces)[index],
                        'netmask': i.netmask,
                        'broadcast': LocalNetwork.calculateBroadcast(i)
                    };
                }
                return [];
            }
            const externalIPv4Interfaces: NetworkInterfaceInfo[] =
                Object.values(interfaces)
                    .reduce(
                        (acc: NetworkInterfaceInfo[], curr, index) =>
                            acc.concat(
                                curr!.reduce(
                                    (acc2, curr2) =>
                                        acc2.concat(suitableItem(curr2, index)), [] as NetworkInterfaceInfo[]
                                )
                            ), [] as NetworkInterfaceInfo[]
                    );
            console.dirxml(localFormattedTime() + ": (networkInterface) helper / external interfaces: ", externalIPv4Interfaces);
            if (!externalIPv4Interfaces || externalIPv4Interfaces.length !== 1) {
                console.dirxml(localFormattedTime() + ": (networkInterface) all interfaces: ", interfaces);
                return undefined;
            }
            this.defaultNetworkInterface = externalIPv4Interfaces[0] as unknown as NetworkInterface;
            return this.defaultNetworkInterface;
        } catch (e) {
            console.warn(localFormattedTime() + ": (networkInterface) Error determine network interfaces: " + e);
        }
        return undefined;
    }
}
