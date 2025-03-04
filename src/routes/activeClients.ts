import * as http from "http";
import {localFormattedTime, VERSION} from "../helper/Helper";
import {headerHtml200} from "../helper/Http";
import {EwakeMetrics} from "../helper/EwakeMetrics";
import {Client, ClientManagement} from "../helper/ClientManagement";

export async function activeClients(res: http.ServerResponse): Promise<void> {
    const mgmt = ClientManagement.instance;
    const allClients: Array<Client> = await mgmt.allClients();
    allClients.sort((a, b) => a.name.localeCompare(b.name));

    const overview = await Promise.all(
        allClients.map(async client =>
            ({client, available: await mgmt.isAvailabe(client)})
        ));

    const padLength = overview.reduce((accum, current) => Math.max(accum, current.client.ip.length), 0);
    const html = `\
        <!DOCTYPE html>
        <head>
            <title>Show active clients</title>
        </head>
        <body style="font-family: 'Courier New', Courier, monospace; font-size: small;">
            <strong>${localFormattedTime()}: show active clients (Version: ${VERSION()}; Host: ${EwakeMetrics.hostname})</strong>
            <br><br>
            ${overview.map(e => `\
                <span style="background-color: ${e.available ? "lightgreen" : "white"} ;"><span title="${e.client.ip} -> ${e.client.mac}">IP: ${e.client.ip.padEnd(padLength).replaceAll(" ", "&nbsp;")}</span> | CLIENT: <span title="${e.client.name} -> ${e.client.description}">${e.client.name}</span></span><br>`).join("")}
         </body>`;
    headerHtml200(res);
    res.write(html);
    res.end();
}
