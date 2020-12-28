import dayjs = require("dayjs");

export function localFormattedTime(date?: Date): string {
    return dayjs(date).locale('de').format('DD-MM-YYTHH:mm:ss');
}

/**
 * holds the current version (from package.json)
 */
export class PackageInfo {
    private static INFO = require("../../package.json");

    static get version(): string {
        return this.INFO.version;
    }
}
