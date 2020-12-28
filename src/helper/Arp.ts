import {spawn} from "child_process";
import * as os from "os";
import {localFormattedTime} from "./Helper";

// based on node-arp, but slightly modified to support async/await and fix some bugs on Mac and Linux
// extend Linux to support BusyBox arp as well
export class Arp {
    /**
     * get the mac address for the given ip address (supports Linux (also BusyBox), Mac, Windows)
     * @param ipaddress
     * @return {string | boolean} mac address or false
     */
    static async getMAC(ipaddress: string): Promise<string | boolean> {
        let result;
        try {
            switch (process.platform) {
                case "darwin":
                    result = await Arp.readMACMac(ipaddress);
                    break;
                case "linux":
                    result = await Arp.readMACLinux(ipaddress);
                    break;
                case "win32":
                case "cygwin":
                    result = await Arp.readMACWindows(ipaddress);
                    break;
                default:
                    console.warn(localFormattedTime() + `: (getMAC) Platform not supported: ${process.platform}`);
                    return false;
            }
        } catch (e) {
            console.warn(localFormattedTime() + ": " + e);
            return false;
        }

        return result as string;
    }

    private static readMACLinux(ipaddress: string): Promise<string | Error> {
        return new Promise<string | Error>((resolve, reject) => {
            const arp = spawn("arp", ["-n", ipaddress]);
            let buffer = '';
            let errstream = '';
            arp.stdout.on('data', (data) => {
                buffer += data;
            });
            arp.stderr.on('data', (data) => {
                errstream += data;
            });

            arp.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error("Error running arp " + code + " " + errstream));
                    return;
                }

                if (buffer.startsWith("Address")) {
                    //Lookup succeeded : Address                  HWtype  HWaddress           Flags Mask            Iface
                    //					IPADDRESS	              ether   MACADDRESS   C                     IFACE
                    //Lookup failed : HOST (IPADDRESS) -- no entry
                    //There is minimum two lines when lookup is successful
                    const table = buffer.split(os.EOL);
                    if (table.length >= 2 && table[0] === 'Address') {
                        const parts = table[1].split(' ').filter(String);
                        if (parts.length !== 0) {
                            resolve(parts.length === 5 ? parts[2] : parts[1]);
                            return;
                        }
                    }
                }
                // BusyBox (arp -n 172.17.0.1)
                else if (buffer.includes(ipaddress)) {
                    // ? (172.17.0.1) at 02:42:de:1a:a4:39 [ether]  on eth0
                    const parts = buffer.split(' ').filter(String);
                    let index: number;
                    // mac is written after 'at'
                    if ((index = parts.findIndex(part => part === "at")) !== -1 && parts.length >= index) {
                        resolve(parts[index + 1]);
                        return;
                    }
                }
                reject(new Error("Could not find ip in arp table: " + ipaddress));
            });
        });
    }

    private static readMACMac(ipaddress: string): Promise<string | Error> {
        return new Promise<string | Error>((resolve, reject) => {
            const arp = spawn("arp", ["-n", ipaddress]);
            let buffer = '';
            let errstream = '';
            arp.stdout.on('data', (data) => {
                buffer += data;
            });
            arp.stderr.on('data', (data) => {
                errstream += data;
            });

            arp.on('close', (code) => {
                // On lookup failed OSX returns code 1
                // but errstream will be empty
                if (code !== 0 && errstream !== '') {
                    reject(new Error("Error running arp " + code + " " + errstream));
                    return;
                }

                //parse this format
                //Lookup succeeded : HOST (IPADDRESS) at MACADDRESS on IFACE ifscope [ethernet]
                //Lookup failed : HOST (IPADDRESS) -- no entry
                const parts = buffer
                    .split(' ')
                    .filter(String);
                if (parts[3] !== 'no') {
                    // f8:ff:c2:12:c1:6 -> f8:ff:c2:12:c1:06
                    const mac = parts[3]
                        .split(":")
                        .map(e => e.length === 1 ? `0${e}` : e)
                        .join(":");
                    resolve(mac);
                    return;
                }
                reject(new Error("Could not find ip in arp table: " + ipaddress));
            });
        });
    }

    private static readMACWindows(ipaddress: string): Promise<string | Error> {
        return new Promise<string | Error>((resolve, reject) => {
            const arp = spawn("arp", ["-a", ipaddress]);
            let buffer = '';
            let errstream = '';
            let lineIndex;

            arp.stdout.on('data', (data) => {
                buffer += data;
            });
            arp.stderr.on('data', (data) => {
                errstream += data;
            });

            arp.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error("Error running arp " + code + " " + errstream));
                    return;
                }

                const table = buffer.split(os.EOL);
                for (lineIndex = 3; lineIndex < table.length; lineIndex++) {
                    //parse this format
                    //[blankline]
                    //Interface: 192.º68.1.54
                    //  Internet Address      Physical Address     Type
                    //  192.168.1.1           50-67-f0-8c-7a-3f    dynamic

                    const parts = table[lineIndex].split(' ').filter(String);
                    if (parts[0] === ipaddress) {
                        const mac = parts[1].replace(/-/g, ':');
                        resolve(mac);
                        return;
                    }
                }
                reject(new Error("Could not find ip in arp table: " + ipaddress));
            });
        });
    }
}

