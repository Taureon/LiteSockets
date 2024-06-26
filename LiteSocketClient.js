/* jshint esversion: 11 */
import { Agent } from './shared.js';
let webSocket = typeof WebSocket === 'undefined' ? import('ws') : WebSocket,

invalidateWebSocketURL = url => {
    try {
        url = new URL(url);
        return url.protocol != 'ws:' && url.protocol != 'wss:';
    } catch (err) {
        return true;
    }
};

class Client extends Agent {
    constructor (args) {
        if ('object' != typeof args) {
            throw new Error("First argument is not an object!");
        }
        if ('string' != typeof args.url) {
            throw new Error("Attribute 'url' is not a string or is not defined!");
        }
        if (invalidateWebSocketURL(args.url)) {
            throw new Error(`Provided url ${args.url} is not a valid websocket url!`);
        }

        super({
            connection: new webSocket(args.url),
            structsReceive: args.serverPackages,
            structsSend: args.clientPackages,
            key: args.key
        });
    }
}

export { Client };