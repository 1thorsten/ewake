import * as os from "os";
import {localFormattedTime} from "./Helper";
import {Client} from "./ClientManagement";

export type MetricData = {
    date: Date, action: "etherwake" | "tcp-ping", client: Client, data?: any
}

/**
 * holds information about the usage of ewake functions
 */
export class EwakeMetrics {
    public static hostname: string = os.hostname();
    private static metricDataMaxSize = 1000;
    private _metricData: Array<MetricData> = [];

    private constructor() {
    }

    private static _instance: EwakeMetrics = new EwakeMetrics();

    public static get instance(): EwakeMetrics {
        return this._instance;
    }

    private _serverStart: string = localFormattedTime();

    public get serverStart(): string {
        return this._serverStart;
    }

    public static start() {
        console.log(this._instance.serverStart + ": start server metrics");
    }

    public addData(data: MetricData): void {
        const arraySize = this._metricData.length;
        if(arraySize > EwakeMetrics.metricDataMaxSize) {
            this._metricData = this._metricData.slice(arraySize-EwakeMetrics.metricDataMaxSize)
        }
        this._metricData.push(data);
    }

    public toJson(): any {
        return {
            hostname: EwakeMetrics.hostname,
            started: this._serverStart,
            etherwake: this._metricData
                .filter(e => e.action === "etherwake")
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map(e => <any>{
                    date: localFormattedTime(e.date),
                    client: e.client.name,
                    description: e.client.description,
                    data: e.data
                }),
            "tcp-ping": this._metricData
                .filter(e => e.action === "tcp-ping")
                .filter(e => e?.data?.awake === true)
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map(e => <any>{
                    date: localFormattedTime(e.date),
                    client: e.client.name,
                    description: e.client.description,
                    data: e.data
                })
        }
    }
}
