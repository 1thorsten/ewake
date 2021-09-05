import * as dashdash from "dashdash";
import {Option} from "dashdash";
import {PackageInfo} from "./Helper";
import {URL} from "url";
import {LocalNetwork, NetworkInterface} from "./LocalNetwork";

export type Opts = { PORT: number, CLIENT_JSON?: string, HTTP_GET?: URL, HTTP_WRITE?: URL, NETWORK_INTERFACE?: NetworkInterface };

function handleArgs(): Opts {
    // get PORT from env or take 5555 as default
    const defaultPort = process.env["EWAKE_PORT"] || "5555";
    let defaultClientJson = process.env["EWAKE_JSON_FILE"] || undefined;
    const defaultHttpGet = process.env["EWAKE_JSON_HTTP"] ? new URL(process.env["EWAKE_JSON_HTTP"]) : undefined;
    const defaultHttpWrite = process.env["EWAKE_JSON_HTTP_WRITE"] ? new URL(process.env["EWAKE_JSON_HTTP_WRITE"]) : undefined;
    const defaultNetworkInterface = process.env["EWAKE_NETWORK_INTERFACE"] ?
        LocalNetwork.identifyNetworkInterfaceStrict(process.env["EWAKE_NETWORK_INTERFACE"]) : LocalNetwork.instance.networkInterface();

    if (defaultClientJson && defaultHttpGet) {
        defaultClientJson = undefined;
    }
    const processedOpts: Opts = {
        PORT: parseInt(defaultPort),
        CLIENT_JSON: defaultClientJson,
        HTTP_GET: defaultHttpGet,
        HTTP_WRITE: defaultHttpWrite,
        NETWORK_INTERFACE: defaultNetworkInterface
    };

// https://www.npmjs.com/package/dashdash
    const options: Array<Option> = [
        {
            name: 'version',
            type: 'bool',
            help: 'Print tool version and exit.'
        }, {
            names: ['help', 'h'],
            type: 'bool',
            help: 'Print this help and exit.'
        },
        {
            names: ['file', 'f'],
            type: 'string',
            help: 'File to load and save the clients as json',
            helpArg: "resources/clients.json"
        },
        {
            names: ['interface', 'i'],
            type: 'string',
            help: 'network interface (ipv4)',
            helpArg: processedOpts.NETWORK_INTERFACE?.name
        },
        {
            names: ['port', 'p'],
            type: 'number',
            help: 'Port on which the server listens',
            helpArg: processedOpts.PORT.toString()
        },
        {
            names: ['http'],
            type: 'string',
            help: 'json-object for http-get',
            helpArg: "http://USER:PASS@localhost:8338/local/client.json"
        },
        {
            names: ['httpWrite'],
            type: 'string',
            help: 'json-object for http-write (DAV)',
            helpArg: "http://USER:PASS@localhost:8338/local/client.json"
        }
    ];

    const parser = dashdash.createParser({options: options});

    let opts;

    try {
        opts = parser.parse(process.argv);
    } catch (e: any) {
        console.error('ewake: error: %s', e.message);
        process.exit(1);
    }

// Use `parser.help()` for formatted options help.
    const showHelp = () => {
        const help = parser.help({includeEnv: true, includeDefault: true}).trimRight();
        console.log('usage: node ewake.js [OPTIONS]\n'
            + 'options:\n'
            + help);
    }
    if (opts.help) {
        showHelp();
        process.exit(0);
    }
    if (opts.version) {
        console.log("ewake.js, version " + PackageInfo.version);
        process.exit(0);
    }
    if (opts.port) {
        processedOpts.PORT = opts.port;
    }
    if (opts.file) {
        processedOpts.CLIENT_JSON = opts.file;
    }
    if (opts.http) {
        if (opts.file) {
            console.warn("you cannot mix option file with option http");
            showHelp();
            process.exit(1);
        }

        processedOpts.HTTP_GET = new URL(opts.http);
    }
    if (opts.httpWrite) {
        if (!opts.http) {
            console.warn("you have to specify option http");
            showHelp();
            process.exit(1);
        }
        processedOpts.HTTP_WRITE = new URL(opts.httpWrite);
    }

    if (opts.interface) {
        const networkInterface = LocalNetwork.identifyNetworkInterface(opts.interface);
        if (Array.isArray(networkInterface)) {
            console.warn("Could not identify given network interface: " + opts.interface);
            console.log(`Possible interfaces (ipv4, external):\n${JSON.stringify(networkInterface,null,2)}`);
            process.exit(1);
        }
        processedOpts.NETWORK_INTERFACE = networkInterface;
    }

    if (!processedOpts.CLIENT_JSON && !processedOpts.HTTP_GET) {
        console.warn("you have to specify one option for receiving clients.json (option file or option http)");
        showHelp();
        process.exit(1);
    }

    return processedOpts;
}

export class ParsedArgs {
    private static processedOpts: Opts = handleArgs();

    static getOpts(): Opts {
        return this.processedOpts;
    }
}
