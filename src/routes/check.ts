import * as http from "http";
import {EwakeMetrics} from "../helper/EwakeMetrics";
import {headerJson200} from "../helper/Http";

export async function check(res: http.ServerResponse): Promise<void> {
    headerJson200(res);

    res.write(JSON.stringify(EwakeMetrics.instance.toJson()));
    res.end();
}
