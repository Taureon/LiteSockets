/* jshint esversion: 11 */
let webSocket = WebSocket || require('ws'),
    Agent = window?.LiteSockets?.Agent || require('./shared.js').Agent;

invalidateWebSocketURL = url => {
    try {
        url = new URL(url);
        return url.protocol != 'ws' && url.protocol != 'wss';
    } catch (err) {
        return true;
    }
};

class LiteSocketClient extends Agent {
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
            structsReceive: args.clientPackages,
            structsSend: args.serverPackages,
            key: args.key
        });
    }
}

if (typeof module != "undefined") {
    module.exports = { Client };
} else if (window.LiteSockets) {
    window.LiteSockets.Client = Client;
} else {
    window.LiteSockets = { Client };
}