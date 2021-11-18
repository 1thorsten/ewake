import {headerHtml200} from "../helper/Http";
import * as http from "http";
import {IncomingMessage} from "http";
import {localFormattedTime, VERSION} from "../helper/Helper";
import {EwakeMetrics} from "../helper/EwakeMetrics";
import {Arp} from "../helper/Arp";

const requestIp = require("request-ip");

export async function clientInfo(req: IncomingMessage, res: http.ServerResponse): Promise<void> {
    const clientIp = requestIp.getClientIp(req);
    const mac = await Arp.getMAC(clientIp);
    headerHtml200(res);
    const html = `\
        <!DOCTYPE html>
        <head>
            <title>Client Info</title>
        </head>
        <body style="font-family: 'Courier New', Courier, monospace; font-size: small;">
            <b>${localFormattedTime()}: clientInfo (Version: ${VERSION()}; Host: ${EwakeMetrics.hostname})</b><br><br><br>
            <strong>IP-Address:</strong> ${clientIp}<br>
            <strong>MAC-Address:</strong> ${mac ? mac : "could not resolve mac address (seems to be that the server hosting ewake lies in a different network)"}<br>
            <pre>
JSON for add or delete client
{
  "name": "JDOE",
  "description": "John Doe",
  "mac": "${!mac ? 'e.g. E4:54:E8:A4:97:2F' : mac}",
  "ip": "${clientIp}"
}            
            </pre>
         </body>`;
    res.write(html);
    res.end();
}
