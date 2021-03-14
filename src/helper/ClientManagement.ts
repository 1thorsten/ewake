import {existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import {ParsedArgs} from "./ParsedArgs";
import {localFormattedTime} from "./Helper";
import {Tcp} from "./Tcp";
import * as wol from "wake_on_lan";
import {ErrorCallback} from "wake_on_lan";
import * as path from "path";
import axios, {AxiosRequestConfig} from "axios";
import {URL} from "url";

export type Client = {
    name: string,
    description: string
    mac: string,
    ip: string,
    check: string
}

interface ClientOperation {
    clientsUptodate(): Promise<boolean>;

    loadClients(): Promise<Array<Client>>;

    storePossible(): boolean;

    storeClients(CLIENT_DATA: Array<Client>): Promise<void>;
}

class ClientFileSystemOperation implements ClientOperation {

    async clientsUptodate(): Promise<boolean> {
        return new Promise<boolean>(resolve => resolve(true));
    }

    async loadClients(): Promise<Array<Client>> {
        const clientjson = ParsedArgs.getOpts().CLIENT_JSON!;
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

    storePossible(): boolean {
        return true;
    }

    async storeClients(CLIENT_DATA: Array<Client>): Promise<void> {
        if (CLIENT_DATA && Array.isArray(CLIENT_DATA)) {
            CLIENT_DATA.sort((a, b) => a.name.localeCompare(b.name));
            console.log(localFormattedTime() + `: (storeClients) -> ${ParsedArgs.getOpts().CLIENT_JSON} (elements: ${CLIENT_DATA.length})`);
            writeFileSync(ParsedArgs.getOpts().CLIENT_JSON!, JSON.stringify(CLIENT_DATA, null, 2), {encoding: "utf8"});
        }
    }
}

class ClientHttpOperation implements ClientOperation {
    private lastModified: string = "";

    private static handleUrl(url: URL): { url: string, requestConfig: AxiosRequestConfig } {
        // https://nodejs.org/api/url.html
        const httpUrl = `${url.origin}${url.pathname}`;
        let requestConfig: AxiosRequestConfig = {};
        if (url.username) {
            requestConfig.auth = {username: url.username, password: url.password};
        }
        return {url: httpUrl, requestConfig};
    }

    async clientsUptodate(): Promise<boolean> {
        const pUrl = ClientHttpOperation.handleUrl(ParsedArgs.getOpts().HTTP_GET!);
        const fmt = localFormattedTime();
        console.time(`${fmt}: (clientsUptodate) http head '${pUrl.url}'`);
        try {
            const rs = await axios.head(pUrl.url, pUrl.requestConfig);
            return this.lastModified === rs.headers['last-modified'];
        } catch (ex) {
            console.warn("(clientsUptodate) could not send head request to " + pUrl.url);
        }
        console.timeEnd(`${fmt}: (clientsUptodate) http head '${pUrl.url}'`);
        return true;
    }

    async loadClients(): Promise<Array<Client>> {
        const pUrl = ClientHttpOperation.handleUrl(ParsedArgs.getOpts().HTTP_GET!);
        const fmt = localFormattedTime();
        console.time(`${fmt}: (loadlients) http get '${pUrl.url}'`);
        try {
            const rs = await axios.get(pUrl.url, pUrl.requestConfig);
            this.lastModified = rs.headers['last-modified'];
            const clients: Array<Client> = rs.data;
            clients.sort((a, b) => a.name.localeCompare(b.name));
            return clients;
        } catch (ex) {
            console.error("could not load clients from " + pUrl.url, ex);
        } finally {
            console.timeEnd(`${fmt}: (loadlients) http get '${pUrl.url}'`);
        }
        return [];
    }

    storePossible(): boolean {
        return ParsedArgs.getOpts().HTTP_WRITE !== undefined;
    }

    async storeClients(CLIENT_DATA: Array<Client>): Promise<void> {
        if (CLIENT_DATA && Array.isArray(CLIENT_DATA)) {
            CLIENT_DATA.sort((a, b) => a.name.localeCompare(b.name));
            const fmt = localFormattedTime();
            if (!this.storePossible()) {
                console.log(`${fmt}: (storeClients) storing not possible (option httpWrite)`);
                return;
            }
            const pUrl = ClientHttpOperation.handleUrl(ParsedArgs.getOpts().HTTP_WRITE!);
            console.time(`${fmt}: (storeClients) http put '${pUrl.url}'`);
            try {
                const rs = await axios.put(pUrl.url, CLIENT_DATA, pUrl.requestConfig);
                this.lastModified = rs.headers['date'];
            } catch (ex) {
                console.error("could not write clients to " + pUrl.url, ex);
            } finally {
                console.timeEnd(`${fmt}: (storeClients) http put '${pUrl.url}'`);
            }
        }
    }

}

export class ClientManagement {
    private static INSTANCE = new ClientManagement();
    private operation: ClientOperation;
    private CLIENT_DATA: Array<Client> | undefined;

    private constructor() {
        this.operation = ParsedArgs.getOpts().CLIENT_JSON ? new ClientFileSystemOperation() : new ClientHttpOperation();
    }

    public static get instance(): ClientManagement {
        return ClientManagement.INSTANCE;
    }

    /**
     * get all clients
     * @return {Array<Client>}
     */
    public async allClients(): Promise<Array<Client>> {
        if (!this.CLIENT_DATA || !await this.operation.clientsUptodate()) {
            this.CLIENT_DATA = await this.operation.loadClients();
        }
        return [...this.CLIENT_DATA!];
    }

    /**
     * add a client and persist data afterwards
     * @param {Client} client
     * @return {boolean}
     */
    public async addClient(client: Client): Promise<boolean> {
        if (this.CLIENT_DATA!.filter(e => e.mac === client.mac && e.ip === client.ip).length > 0) {
            return false;
        }
        console.log(localFormattedTime() + `: (addClient) ${client.name}`);
        this.CLIENT_DATA!.push(client);
        await this.operation!.storeClients(this.CLIENT_DATA!);
        return true;
    }

    /**
     * delete the client (relevant for deletion is Client#ip and Client#mac), all clients will be persisted afterwards
     * @param {Client} client
     */
    public async deleteClient(client: Client): Promise<boolean> {
        const foundClient: Array<Client> = this.CLIENT_DATA!.filter(e => e.mac === client.mac && e.ip === client.ip);
        if (foundClient.length <= 0) {
            return false;
        }
        foundClient.forEach(c => {
            console.log(localFormattedTime() + `: (deleteClient) ${c.name}`);
            this.CLIENT_DATA!.splice(this.CLIENT_DATA!.indexOf(c, 0), 1);
        });
        await this.operation!.storeClients(this.CLIENT_DATA!);
        return true;
    }

    /**
     * check if the client responds to requests on the specified tcp port
     * @param {Client} client
     */
    public async isAvailabe(client: Client): Promise<boolean> {
        const toCheck = (check: string = "tcp:3389"): { protcol: string, port: number } => {
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
     * @param {Client} client
     * @param {string} broadcast
     */
    public async wakeup(client: Client, broadcast: string): Promise<void> {
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
