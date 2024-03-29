import * as http from "http";
import {headerHtml200, httpError} from "../helper/Http";
import {EwakeMetrics, MetricData} from "../helper/EwakeMetrics";
import {localFormattedTime, VERSION} from "../helper/Helper";
import {Client, ClientManagement} from "../helper/ClientManagement";

export async function tcpPing(queryObject: { name?: string}, res: http.ServerResponse): Promise<void> {
    const clientName = queryObject.name;
    if (!clientName) {
        httpError(res, "plain", "USAGE: /tcp-ping?name=[Client:name]");
        res.end();
        return;
    }

    // mac
    const allClients: Array<Client> = await ClientManagement.instance.allClients();
    const client = allClients.find(o => o.name.toUpperCase() === clientName);
    if (!client) {
        const message = `\
USAGE: /tcp-ping?name=[Client:name]

Client '${clientName.toUpperCase()}' not found.`;
        httpError(res, "plain", message);
        return;
    }

    const metricData: MetricData = {
        date: new Date(),
        action: "tcp-ping",
        client
    };
    let html;
    if (!await ClientManagement.instance.isAvailabe(client)) {
        const refreshSecs = 6;
        html = `\
        <!DOCTYPE html>
        <head>
            <meta http-equiv="refresh" content="${refreshSecs}">
            <title>tcp-ping ${client.name}</title>
        </head>
        <body style="font-family: 'Courier New', Courier, monospace; font-size: small;">
            <b>${localFormattedTime()}: tcp-ping ${client.name} (Refresh every ${refreshSecs} secs; Version: ${VERSION()}; Host: ${EwakeMetrics.hostname})</b><br><br><br>
            Computer is not ready, please wait... (${client.ip} is not responding to requests on ${client.check})`;

        metricData.data = {awake: false};
    } else {
        html = `\
        <!DOCTYPE html>
        <head>
            <title>tcp-ping ${client.name}</title>
        </head>
        <body style="font-family: 'Courier New', Courier, monospace; font-size: small;">
            <b>${localFormattedTime()}: tcp-ping ${client.name} (Version: ${VERSION()}; Host: ${EwakeMetrics.hostname})</b><br><br><br>
            <b>Computer (${client.ip}) seems to be ready, you can connect (${client.check})</b>`;

        metricData.data = {awake: true};
    }
    EwakeMetrics.instance.addData(metricData);
    headerHtml200(res);
    res.write(html);
    res.end("</body>");
}
