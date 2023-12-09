import * as http from "http";
import {EwakeMetrics} from "../helper/EwakeMetrics";
import {headerJson200} from "../helper/Http";

export async function check(res: http.ServerResponse): Promise<void> {
    const metrics = JSON.stringify(EwakeMetrics.instance.toJson());
    headerJson200(res);
    res.write(metrics);
    res.end();
}
