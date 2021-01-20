import * as http from 'http';
import * as url from 'url';
import {htmlLinks, httpError} from './helper/Http';
import {EwakeMetrics} from './helper/EwakeMetrics';
import {localFormattedTime, PackageInfo} from './helper/Helper';
import {Opts, ParsedArgs} from './helper/ParsedArgs';
const opts: Opts = ParsedArgs.getOpts();

try {
    console.log(`${localFormattedTime()}: (ewake): Start http-server on port: ${opts.PORT}`);
    console.log('USAGE: /etherwake?name=[Client:name]');

    console.log(`Version: ${PackageInfo.version}`);

    const server = httpServer();
    trapHandler(server);
    EwakeMetrics.start();
    // restrict to ipv4 only
    server.listen(opts.PORT, "0.0.0.0");
} catch (e) {
    console.error(e);
}

function httpServer(): http.Server {
    return http.createServer(async (req, res) => {

        const parsedUrl = url.parse(req.url!, true);
        const queryObject: { name?: string, interface?: string } = parsedUrl.query;

        try {
            if (queryObject.name) {
                queryObject.name = queryObject.name.toUpperCase().replace(/[^A-Z\/_]/g, '');
            }
            if (queryObject.interface) {
                queryObject.interface = queryObject.interface.replace(/[&;,<>]/g, '');
            }
            const startTimestamp = localFormattedTime();
            if (req.method === 'GET') {
                switch (parsedUrl.pathname) {
                    case '/etherwake':
                        console.time(`${startTimestamp}: ewake / call etherwake ${queryObject.name ? `for ${queryObject.name}` : ''}`);
                        await require('./routes/etherwake').etherwake(queryObject, res);
                        console.timeEnd(`${startTimestamp}: ewake / call etherwake ${queryObject.name ? `for ${queryObject.name}` : ''}`);
                        break;
                    case '/tcp-ping':
                        console.time(`${startTimestamp}: ewake / call tcp-ping for ${queryObject.name}`);
                        await require('./routes/tcp-ping').tcpPing(queryObject, res);
                        console.timeEnd(`${startTimestamp}: ewake / call tcp-ping for ${queryObject.name}`);
                        break;
                    case '/check':
                        console.time(`${startTimestamp}: ewake / call check (internal logs)`);
                        await require('./routes/check').check(res);
                        console.timeEnd(`${startTimestamp}: ewake / call check (internal logs)`);
                        break;
                    case '/activeClients':
                        console.time(`${startTimestamp}: ewake / call activeClients`);
                        await require('./routes/activeClients').activeClients(res);
                        console.timeEnd(`${startTimestamp}: ewake / call activeClients`);
                        break;
                    case '/clientInfo':
                        console.time(`${startTimestamp}: ewake / call clientInfo`);
                        await require('./routes/clientInfo').clientInfo(req, res);
                        console.timeEnd(`${startTimestamp}: ewake / call clientInfo`);
                        break;
                    default:
                        // noinspection HtmlUnknownTarget
                        httpError(res, 'html', `\
                        <strong>
                            USAGE: /etherwake?name=[Client:name]<br><br>
                            ${htmlLinks()}                           
                        </strong>`);
                }
            } else if (req.method === 'PUT') {
                switch (parsedUrl.pathname) {
                    case '/manageClients':
                        console.time(`${startTimestamp}: ewake / put client`);
                        await require('./routes/manageClients').addClient(req, res);
                        console.timeEnd(`${startTimestamp}: ewake / put client`);
                        break;
                    default:
                        // noinspection HtmlUnknownTarget
                        httpError(res, 'html', `\
                        <strong>
                            PUT http://localhost:5555/manageClients
                            Content-Type: application/json
                            <pre>
                            {
                              "name": "@1thorsten",
                              "description": "Thorsten Winkler",
                              "mac": "E4:54:E8:A4:97:2F",
                              "ip": "20.30.40.50"
                            }
                            </pre>
                        </strong>`);
                }
            } else if (req.method === 'DELETE') {
                switch (parsedUrl.pathname) {
                    case '/manageClients':
                        console.time(`${startTimestamp}: ewake / delete client`);
                        await require('./routes/manageClients').deleteClient(req, res);
                        console.timeEnd(`${startTimestamp}: ewake / delete client`);
                        break;
                    default:
                        // noinspection HtmlUnknownTarget
                        httpError(res, 'html', `\
                        <strong>
                            DELETE http://localhost:5555/manageClients
                            Content-Type: application/json
                            <pre>
                            {
                              "mac": "E4:54:E8:A4:97:2F",
                              "ip": "20.30.40.50"
                            }
                            </pre>
                        </strong>`);
                }
            }
        } catch (e) {
            httpError(res, 'plain', `Error occured\n${e}`);
        }
    });
}

function trapHandler(server: http.Server) {
    process.once('SIGTERM', () => {
        console.log('SIGTERM received...');
        server.close();
    });

    process.once('SIGINT', () => {
        console.log('SIGINT received...');
        server.close();
    });
}
