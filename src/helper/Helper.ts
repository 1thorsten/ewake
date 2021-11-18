import dayjs = require("dayjs");

declare const EWAKE_VERSION: string;

export function localFormattedTime(date?: Date): string {
    return dayjs(date).locale('de').format('DD-MM-YYTHH:mm:ss');
}

export function VERSION() {
    try {
        return EWAKE_VERSION;
    } catch (_) {
        return "development";
    }
}
