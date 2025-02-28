import {IncomingMessage, ServerResponse} from "http";
import {EwakeMetrics} from "./EwakeMetrics";
import {localFormattedTime, VERSION} from "./Helper";

/**
 * reads data from http request
 * @param req IncomingMessage
 * @returns Promise<string>
 */
export function readRequestData(req: IncomingMessage): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        let body: any[] = [];
        req
            .on('data', (chunk) => body.push(chunk))
            .on('end', () => resolve(Buffer.concat(body).toString()))
            .on("error", (err: Error) => reject(err));
    });
}

export function htmlLinks(): string {
    return `\
            <strong>
                <a href="/activeClients" target="_external">show active clients</a><br>
                <a href="/etherwake">show configured etherwake targets</a><br>
                <a href="/check" target="_external">show internal logs</a><br>
                <a href="/clientInfo" target="_external">show ip address and mac address of the requesting host</a><br> 
            </strong>`;
}

export function httpError(res: ServerResponse, contentType: "plain" | "html", message: string): void {
    let body;
    if (contentType === "plain") {
        res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
        res.write(`${localFormattedTime()}: etherwake (Version: ${VERSION()}; Host: ${EwakeMetrics.hostname})\n\n`);
        body = message;
    } else {
        res.writeHead(500, {'Content-Type': 'text/html; charset=utf-8'});
        body = `\
        <!DOCTYPE html>
        <head>  
            <title>Etherwake - Usage (${EwakeMetrics.hostname})</title>
        </head>
        <body style="font-family: 'Courier New', Courier, monospace; font-size: small;">
        <strong>${localFormattedTime()}: etherwake (Version: ${VERSION()}; Host: ${EwakeMetrics.hostname})</strong><br><br>
        ${message}<br>
        </body>`;
    }
    res.write(body);
    res.end();
}

export function headerHtml200(res: ServerResponse): void {
    header200(res, "text/html");
}

export function headerJson200(res: ServerResponse): void {
    header200(res, "application/json");
}

function header200(res: ServerResponse, contentType: string): void {
    res.writeHead(200, {
        'Content-Type': `${contentType}; charset=utf-8`,
        'Cache-Control': 'no-cache, no-store, must-revalidate', // HTTP 1.1
        'Pragma': 'no-cache', // HTTP 1.0
        'Expires': '0' // Proxies
    });
}

