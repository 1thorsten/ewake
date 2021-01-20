import * as http from "http";
import {headerHtml200, readRequestData} from "../helper/Http";
import {Client, ClientManagement} from "../helper/ClientManagement";

export async function addClient(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    headerHtml200(res);

    const clientData = await readRequestData(req);
    const client: Client = JSON.parse(clientData);
    await ClientManagement.instance.addClient(client);

    res.end();
}

export async function deleteClient(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    headerHtml200(res);

    const clientData = await readRequestData(req);
    const client: Client = JSON.parse(clientData);
    await ClientManagement.instance.deleteClient(client);

    res.end();
}
