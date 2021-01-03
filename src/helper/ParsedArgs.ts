import * as dashdash from "dashdash";
import {Option} from "dashdash";
import {PackageInfo} from "./Helper";

export type Opts = { PORT: number, CLIENT_JSON: string }

function handleArgs(): Opts {
    const processedOpts: Opts = {PORT: 5555, CLIENT_JSON: "resources/client.json"};

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
            helpArg: processedOpts.CLIENT_JSON
        },
        {
            names: ['port', 'p'],
            type: 'number',
            help: 'Port on which the server listens',
            helpArg: processedOpts.PORT.toString()
        }
    ];

    const parser = dashdash.createParser({options: options});

    let opts;

    try {
        opts = parser.parse(process.argv);
    } catch (e) {
        console.error('ewake: error: %s', e.message);
        process.exit(1);
    }

// Use `parser.help()` for formatted options help.
    if (opts.help) {
        const help = parser.help({includeEnv: true, includeDefault: true}).trimRight();
        console.log('usage: node ewake.js [OPTIONS]\n'
            + 'options:\n'
            + help);
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

    return processedOpts;
}

export class ParsedArgs {
    private static processedOpts: Opts = handleArgs();

    static getOpts(): Opts {
        return this.processedOpts;
    }
}

