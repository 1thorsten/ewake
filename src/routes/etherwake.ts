import * as http from 'http';
import {headerHtml200, htmlLinks, httpError} from "../helper/Http";
import {EwakeMetrics, MetricData} from "../helper/EwakeMetrics";
import {localFormattedTime, PackageInfo} from "../helper/Helper";
import {Client, ClientManagement} from "../helper/ClientManagement";
import {LocalNetwork, NetworkInterface} from "../helper/LocalNetwork";

function errorClientNameNotGiven(clients: Array<Client>): string {
    return `\
            ${htmlLinks()}
            <br>
            <hr>
            <strong>USAGE: /etherwake?name=[Client:name]</strong><br>
            <br>
            Param: <strong>name</strong> not given<br>
            Default network interface: ${LocalNetwork.instance.networkInterface()?.name}<br>
            <br> 
            ${clients.length > 0 ?
        "The following clients are available:<br>" :
        "No clients are available:<br>"}          
            <br>
            ${clients.map(u => `<a href="/etherwake?name=${u.name}">${u.name}</a>`).join("<br>")}
            <br>
            <br>
            ${clients.length > 0 ? "Complete Entries:<br>" : ""}
            ${clients.map(u => `IP: ${u.ip} | MAC: ${u.mac} | CLIENT: ${u.name} (${u.description}) `).join("<br>")}
        `;
}

function errorClientNotFound(clientName: string, clients: Array<Client>): string {
    return `\
            ${htmlLinks()}
            <br>
            <hr>
            <strong>USAGE: /etherwake?name=[Client:name]</strong><br>
            <br>
            Client <strong>'${clientName.toUpperCase()}'</strong> not found.<br>
            <br>
            The following clients are available:<br>
            ${clients.map(u => `<a href="/etherwake?name=${u.name}">${u.name}</a>`).join("<br>")}
        `;
}

function errorCouldNotIdentifyDefaultNetworkInterface(): string {
    return `\
                ${htmlLinks()}
                <br>
                <hr>
                <strong>USAGE: /etherwake?name=[Client:name]&interface=[INTERFACE]</strong><br>
                <br>
                Could not identify an interface<br>
            `;
}

function errorCouldNotIdentifyGivenNetworkInterface(givenInterface: string, interfaceOverview: string []): string {
    return `\
                ${htmlLinks()}
                <br>
                <hr>
                <strong>USAGE: /etherwake?name=[Client:name]&interface=[INTERFACE]</strong><br>
                <br>
                Could not identify the interface: ${givenInterface}<br>
                <br>Available interfaces:<br>
                ${interfaceOverview.sort().join("<br>")}
            `;
}

export async function etherwake(queryObject: { name?: string, interface?: string }, res: http.ServerResponse): Promise<void> {
    const mgmt = ClientManagement.instance;
    const clients: Array<Client> = await mgmt.allClients();
    const clientName = queryObject.name;

    // clientname not given
    if (!clientName) {
        httpError(res, "html", errorClientNameNotGiven(clients));
        return;
    }

    // client not found
    const client = clients.find(o => o.name.toUpperCase() === clientName);
    if (!client) {
        httpError(res, "html", errorClientNotFound(clientName, clients));
        return;
    }

    // interface
    let iface: NetworkInterface;
    if (!queryObject.interface) {
        const detectedInterface = LocalNetwork.instance.networkInterface();
        if (!detectedInterface) {
            return httpError(res, "html", errorCouldNotIdentifyDefaultNetworkInterface());
        } else {
            iface = detectedInterface;
        }
    } else {
        let ifaceCheck: NetworkInterface | string[] = LocalNetwork.identifyNetworkInterface(queryObject.interface)
        if (Array.isArray(ifaceCheck)) {
            return httpError(res, "html", errorCouldNotIdentifyGivenNetworkInterface(queryObject.interface, ifaceCheck));
        } else {
            iface = ifaceCheck;
        }
    }

    const metricData: MetricData = {
        date: new Date(),
        action: "etherwake",
        client
    };

    headerHtml200(res);

    const htmlStart = `\
    <!DOCTYPE html>
    <head>
        <title>Etherwake ${client.name} (${EwakeMetrics.hostname})</title>
    </head>
    <body style="font-family: 'Courier New', Courier, monospace; font-size: small;">
        <strong>${localFormattedTime()}: etherwake ${client.name} (Version: ${PackageInfo.version}; Host: ${EwakeMetrics.hostname})</strong>
        <br><br>`;

    res.write(htmlStart);
    // check if the computer is already running
    if (await mgmt.isAvailabe(client)) {
        res.write(`\
            ${htmlLinks()}
            <br>
            <strong>
                Computer (${client.ip}) seems to be ready, you can connect (tcp-port: 3389)
            </strong><br>`
        );
        metricData.data = {awake: true};
    } else {
        res.write(`wakeup ${client.mac} (interface: ${iface.name} | broadcast: ${iface.broadcast})<br>`);

        let message;
        try {
            await mgmt.wakeup(client, iface.broadcast);
        } catch (error: any) {
            const normalizedOut = error.message.trim().split("\n").map((line: string) => `<b>Error : </b>${line}`).join("<br>");
            message = normalizedOut;
            res.write(normalizedOut);
        }
        res.write(`\
            <br><br>
            <strong>
                <a href="/tcp-ping?name=${clientName}" target="_external">send tcp-ping (${client.check})</a>
            </strong><br>
            ${htmlLinks()}
            <br>
            <iframe src="/tcp-ping?name=${clientName}" width="80%"></iframe>`
        );

        metricData.data = {message: message, sendPing: true};
    }
    res.end("</body>");
    EwakeMetrics.instance.addData(metricData);
}
