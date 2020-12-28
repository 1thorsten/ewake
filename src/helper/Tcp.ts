import {Socket} from "net";

export class Tcp {
    /**
     * check whether the tcp port is open or not
     * @param port the tcp port to check
     * @param host the hostname or ipaddress (default: 127.0.0.1)
     * @param timeout timeout in milliseconds before give up (default: 1000)
     */
    static async checkTcpPort(port: number, host: string = "127.0.0.1", timeout: number = 1000): Promise<boolean> {
        try {
            return await new Promise(((resolve, reject) => {
                const socket = new Socket();

                const onError = () => {
                    socket.destroy();
                    reject();
                };

                socket.setTimeout(timeout);
                socket.once('error', onError);
                socket.once('timeout', onError);

                socket.connect(port, host, () => {
                    socket.end();
                    resolve(true);
                });
            }));
        } catch (_) {
            return false;
        }
    }

}
