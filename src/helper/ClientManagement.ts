import {existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import {ParsedArgs} from "./ParsedArgs";
import {localFormattedTime} from "./Helper";
import {Tcp} from "./Tcp";
import * as wol from "wake_on_lan";
import {ErrorCallback} from "wake_on_lan";
import * as path from "path";

export type Client = {
    name: string,
    description: string
    mac: string,
    ip: string,
    check: string
}

export class ClientManagement {
    private static INSTANCE = new ClientManagement();
    private readonly CLIENT_DATA: Array<Client> = ClientManagement.loadClients();

    private constructor() {
    }

    public static get instance(): ClientManagement {
        return ClientManagement.INSTANCE;
    }

    /**
     * get all clients
     * @return {Array<Client>}
     */
    public get allClients(): Array<Client> {
        return [...this.CLIENT_DATA];
    }

    private static loadClients(): Array<Client> {
        const clientjson = ParsedArgs.getOpts().CLIENT_JSON;
        if (existsSync(clientjson)) {
            console.log(localFormattedTime() + `: (loadClients) -> ${ParsedArgs.getOpts().CLIENT_JSON}`);
            const content = readFileSync(clientjson, "utf-8");
            const clients: Array<Client> = JSON.parse(content);
            clients.sort((a, b) => a.name.localeCompare(b.name));
            return clients;
        }
        console.log(localFormattedTime() + `: (loadClients) file not found '${clientjson}. It will be created automatically.`);
        const dirname = path.dirname(clientjson);
        if (!existsSync(dirname)) {
            console.log(localFormattedTime() + `: (loadClients) create directory: ${dirname}`);
            mkdirSync(dirname, {recursive: true});
        }
        return [];
    }

    /**
     * add a client and persist data afterwards
     * @param {Client} client
     * @return {boolean}
     */
    public addClient(client: Client): boolean {
        if (this.CLIENT_DATA.filter(e => e.mac === client.mac && e.ip === client.ip).length > 0) {
            return false;
        }
        console.log(localFormattedTime() + `: (addClient) ${client.name}`);
        this.CLIENT_DATA.push(client);
        this.persistClients();
        return true;
    }

    /**
     * delete the client (relevant for deletion is Client#ip and Client#mac), all clients will be persisted afterwards
     * @param {Client} client
     */
    public deleteClient(client: Client): boolean {
        const foundClient: Array<Client> = this.CLIENT_DATA.filter(e => e.mac === client.mac && e.ip === client.ip);
        if (foundClient.length <= 0) {
            return false;
        }
        foundClient.forEach(c => {
            console.log(localFormattedTime() + `: (deleteClient) ${c.name}`);
            this.CLIENT_DATA.splice(this.CLIENT_DATA.indexOf(c, 0), 1);
        });
        this.persistClients();
        return true;
    }

    /**
     * save the client information to file (sorted)
     * @private
     */
    private persistClients(): void {
        if (this.CLIENT_DATA && Array.isArray(this.CLIENT_DATA)) {
            this.CLIENT_DATA.sort((a, b) => a.name.localeCompare(b.name));
            console.log(localFormattedTime() + `: (persistClients) -> ${ParsedArgs.getOpts().CLIENT_JSON} (elements: ${this.CLIENT_DATA.length})`);
            writeFileSync(ParsedArgs.getOpts().CLIENT_JSON, JSON.stringify(this.CLIENT_DATA, null, 2), {encoding: "utf8"});
        }
    }

    /**
     * check if the client responds to requests on the specified tcp port
     * @param {Client} client
     */
    public async isAvailabe(client: Client): Promise<boolean> {
        const toCheck = (check: string): { protcol: string, port: number } => {
            // tcp:3389
            const splitted = check.split(":");
            if (splitted.length != 2) {
                throw new Error("Wrong format for check. Expecting 'protocol (string):port (number)' -> " + check);
            }

            let protocol = splitted[0].toLowerCase();
            if (protocol !== "tcp") {
                throw new Error("Wrong protocol. Only tcp is allowed yet -> " + splitted[0]);
            }
            // tcp:3389 -> 3389 should be a number
            if (!/^\d+$/.test(splitted[1])) {
                throw new Error("Wrong port. Could not understand number  -> " + splitted[1]);
            }
            const port = parseInt(splitted[1], 10);
            if (isNaN(port)) {
                throw new Error("Wrong port. Could not understand number  -> " + splitted[1]);
            }
            return {protcol: protocol, port: port};
        }
        return await Tcp.checkTcpPort(toCheck(client.check).port, client.ip);
    }

    /**
     * send the magic packet
     * @param mac
     * @param broadcast
     */
    public wakeup(client: Client, broadcast: string): Promise<void> {
        return new Promise((resolve, reject) => {
            wol.wake(client.mac, {address: broadcast}, (error: ErrorCallback) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

}
