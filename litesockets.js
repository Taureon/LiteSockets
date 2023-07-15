let LiteSocket = LiteSocket || (() => {

let webSocket = WebSocket || require('ws'),

dataSizes = {
    BigInt64: 8n,
    BigUint64: 8n,
    Float32: 4n,
    Float64: 8n,
    Int8: 1n,
    Int16: 2n,
    Int32: 4n,
    Uint8: 1n,
    Uint16: 2n,
    Uint32: 4n,
    Buffer8: 1n,
    Buffer16: 2n,
    Buffer32: 4n,
    Buffer64: 8n, //no one is going to use Buffer64 or String64 but fuck it why not?
    String8: 1n,
    String16: 2n,
    String32: 4n,
    String64: 8n
},

dataSizeTypes = Object.keys(dataSizes),

textDecoder = new TextDecoder(),
textEncoder = new TextEncoder(),

invalidateWebSocketURL = url => {
    try {
        url = new URL(url);
        return url.protocol != 'ws' && url.protocol != 'wss';
    } catch (err) {
        return true;
    }
},

validateArgs = (args, clientKeys, serverKeys, isClient) => {
    if ('object' != typeof args)                      throw new LiteSocketError("Option is not an object!");
    if ('string' != typeof args.url)                  throw new LiteSocketError("Option 'url' is not a string or is not defined!");
    if (isClient && invalidateWebSocketURL(args.url)) throw new LiteSocketError("Provided url '" + args.url + "' is not a valid websocket url!");
    if ('object' != typeof args.clientPackages)       throw new LiteSocketError("Option 'clientPackages' is not an object or is not defined!");
    if ('object' != typeof args.serverPackages)       throw new LiteSocketError("Option 'serverPackages' is not an object or is not defined!");
    //if (args.encryptionAlgorithm && !(args.encryptionKey instanceof CryptoKey)) throw new LiteSocketError("Option 'encryptionKey' is not an instance of CryptoKey!");
},

validatePackage = (chunkName, chunkData, chunkType, isClient) => {
    if (!dataSizeTypes.includes(chunkType))                             throw new LiteSocketError(chunkName + " is of type '" + chunkType + "' which is not a valid data type!")
    let first = (isClient ? "Client" : "Server") + " Package '" + chunkName + "''s property '" + chunkName;
    if (undefined == chunkData)                                         throw new LiteSocketError(first + "' can't be undefined!");
    if (NaN == chunkData)                                               throw new LiteSocketError(first + "' can't be NaN!");
    if (null == chunkData)                                              throw new LiteSocketError(first + "' can't be null!");
    if (chunkType.startsWith('Buffer') && !isBuffer(chunkData))         throw new LiteSocketError(first + "' is neither a Node.js Buffer or an instance of Uint8Array!");
    if (chunkType.startsWith('String') && "string" == typeof chunkData) throw new LiteSocketError(first + "' is not a string!");
},

parsePackage = (infos, data) => {
    let dataView = new DataView(data),
        parsed = {},
        offset = 0n;
    for (let label in infos) {
        let type = infos[label],
            typeLength = dataSizes[type],
            isString = type.startsWith('String');

        if (isString || type.startsWith('Buffer')) {

            //figure out how long the buffer is
            let i, finalLength = 0n;
            for (i = offset; i < offset + typeLength; i++) finalLength = finalLength << 8n + BigInt(dataView.getUint8(i));

            //get the entire buffer
            let arr = new Uint8Array(parseInt(finalLength));
            for (let j = 0; j < finalLength; j++) arr[j] = data[i + j];

            //decode buffer if its string data and save it
            parsed[label] = isString ? textDecoder.decode(arr) : arr;
            offset += typeLength + finalLength;

        //handle normal data
        } else {
            parsed[label] = dataView['get' + type](parseInt(offset));
            offset += typeLength;
        }
    }
    return parsed;
},

bufferfyPackage = (type, data, sendPackages, sendPackagesID, isClient, valueChecking) => {
    let buffs = [new Uint8Array([sendPackagesID[type]])],
        packageSpecs = sendPackages[type];

    for (let name in packageSpecs) {
        let chunkData = data[name],
            chunkType = packageSpecs[name],
            typeLength = dataSizes[type],
            isString = type.startsWith('String');

        if (valueChecking) validatePackage(name, chunkData, chunkType, isClient);

        if (isString || type.startsWith('Buffer')) {

            //decode buffer if its string data and save it
            chunkData = isString ? textEncoder.encode(chunkData) : chunkData;
            buffs.push(new Uint8Array([chunkData.length]));

            buffs.push(appendBuff);

        //handle normal data
        } else {
            let appendBuff = new Uint8Array(typeLength);
            new DataView(appendBuff)['set' + type](0, chunkData);
            buffs.push(appendBuff);
        }

    }
    let resultLength = 0;
    for (let {length} of buffs) resultLength += length;
    let resultBuff = new Uint8Array(resultLength),
        offset = 0;
    for (let buff of buffs) {
        resultBuff.set(buff, offset);
        offset += buff.length;
    }
    return resultBuff;
},

//i hate seeing Object.keys() and .sort() being used in code so i made this function to hide them
getKeysSorted = x => Object.keys(x).sort(),

sortKeys = obj => {
    let ret = {};
    for (let key of getKeysSorted(obj)) ret[key] = obj[key];
    return ret;
},

sortSubObjs = obj => {
    let ret = {};
    for (let key of obj) ret[key] = sortKeys(obj[key]);
    return ret;
},

isBuffer = buffer => Buffer ? Buffer.isBuffer(buffer) : buffer instanceof Uint8Array;

let EventEmitter = require ? require('events') : class {
    constructor() {
        this.callbacks = {};
    }
    on(event, callback) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(callback);
    }
    emit(event, ...data) {
        if (this.callbacks[event]) for (let i = 0; i < this.callbacks[event].length; i++) this.callbacks[event][i](...data);
    }
};

class LiteSocketError extends Error { constructor(error) { super('LiteSocket Error: ' + error); } }

webSocket.WebSocketServer = webSocket.WebSocketServer || class { constructor() { throw new LiteSocketError('Cannot start a server in a Browser enviroment!'); } };

class LiteSocketClient extends EventEmitter {
    constructor(args) {
        super();
        this.valueChecking = args.valueChecking || true;
        if (this.valueChecking) validateArgs(args, clientKeys, serverKeys, true);

        let clientKeys = getKeysSorted(args.clientPackages),
            serverKeys = getKeysSorted(args.serverPackages);

        this.clientPackages = sortSubObjs(args.clientPackages);
        this.clientPackagesID = {};
        for (let i = 0; i < clientKeys.length; i++) this.clientPackagesID[clientKeys[i]] = i;

        this.serverPackages = sortSubObjs(args.serverPackages);
        this.serverPackagesID = {};
        for (let i = 0; i < serverKeys.length; i++) this.serverPackagesID[i] = serverKeys[i];

        //this.encryptionAlgorithm = args.encryptionAlgorithm || false;
        //this.encryptionKey = args.encryptionKey;
        this.url = args.url;
        this.connect();
    }

    connect() {
        this.socket = new webSocket(this.url);
        this.socket.binaryType = 'arraybuffer';
        this.socket.onopen = event => this.emit('open', event);
        this.socket.onmessage = msg => {
            //TODO: ADD DECRYPTION AND CHECKSUM

            let package = new Uint8Array(msg.data);
            this.emit(this.serverPackagesID[package[0]], parsePackage(this.serverPackages[type], package.slice(1)));
        }
        this.socket.onerror = event => this.emit('error', event);
        this.socket.onclose = closeEvent => this.emit('close', closeEvent);
    }

    canSendMessages() {
        return this.socket.readyState == webSocket.OPEN;
    }

    sendBuffer(msg) {
        if (this.canSendMessages()) this.socket.send(msg);
    }

    send(type, data) {
        //TODO: ADD CHECKSUM AND ENCRYPTION
        if (this.canSendMessages()) sendBuffer(bufferfyPackage(type, data, this.clientPackages, this.clientPackagesID, true, this.valueChecking));
    }

    close(code, reason) {
        this.socket.close(code, reason);
    }
}

class SocketWrap extends EventEmitter {
    constructor (wsSocket, lsServer) {
        super();
        this.socket = wsSocket;
        this.server = lsServer;
        wsSocket.on('message', msg => {
            //TODO: ADD DECRYPTION AND CHECKSUM

            let package = new Uint8Array(msg.data);
            this.emit(this.clientPackagesID[package[0]], parsePackage(this.clientPackages[type], package.slice(1)));
        });
        wsSocket.on('close', event => this.emit('close', event));
    }

    send(type, data) {
        //TODO: ADD CHECKSUM AND ENCRYPTION
        this.socket.send(bufferfyPackage(type, data, this.server.serverPackages, this.server.serverPackagesID, false, this.server.valueChecking));
    }
    
    close() {
        this.socket.close();
    }
}

class LiteSocketServer extends EventEmitter {
    constructor(args) {
        super();
        this.valueChecking = args.valueChecking || true;
        if (this.valueChecking) validateArgs(args, clientKeys, serverKeys, false);

        let clientKeys = getKeysSorted(args.clientPackages),
            serverKeys = getKeysSorted(args.serverPackages);

        this.clientPackages = sortSubObjs(args.clientPackages);
        this.clientPackagesID = {};
        for (let i = 0; i < clientKeys.length; i++) this.clientPackagesID[clientKeys[i]] = i;

        this.serverPackages = sortSubObjs(args.serverPackages);
        this.serverPackagesID = {};
        for (let i = 0; i < serverKeys.length; i++) this.serverPackagesID[i] = serverKeys[i];

        this.options = args.options;
        //this.encryptionAlgorithm = args.encryptionAlgorithm || false;
        //this.encryptionKey = args.encryptionKey;
        this.sockets = [];
        this.server = new webSocket.WebSocketServer(this.options);
        this.server.on('connection', socket => {
            socket = new SocketWrap(socket, this);
            this.socket.push(socket);
            this.emit('connection', req, socket, head);
        });
        this.server.on('error', event => this.emit('error', event));
    }

    listen(...args) {
        this.server.listen(...args);
    }
}

return {
    Client: LiteSocketClient,
    Server: LiteSocketServer,
    validatePackage,
    bufferfyPackage,
    parsePackage
};

if (undefined != module?.exports) module.exports = LiteSocket;

})();

//below examples use various purposefully undefined functions

//packages the client sends to the server
let clientPackages = {
    message: {
        content: 'String8'
    },
    upload: {
        filename: 'String8',
        filedata: 'Buffer32'
    }
},

//packages the server sends to the client
serverPackages = {
    status: {
        playerCount: 'Int16',
        motd: 'String32'
    },
    message: {
        id: 'Int32',
        name: 'String8',
        content: 'String8'
    },
    download: {
        filename: 'String8',
        filedata: 'Buffer32'
    }
},

client = new LiteSocket.Client({
    url: 'wss://example.com/',
    serverPackages,
    clientPackages
});

client.on('open', event => openChat());

client.on('status', status => {
    updateMOTDText(status.motd);
    updatePlayerCountNumber(status.playerCount);
    updatePlayerCountColor(status.playerCount > 16 ? 'red' : 'yellow');
});

client.on('message', message => {
    let messageElement = new Message();
    messageElement.displayName = message.name;
    messageElement.displayText = message.content;
    if (isDebugMode) messageElement.subtitle = message.id;
    addMessageToChat(messageElement);
});

client.on('download', file => {
    //TODO: add example download
});

client.send('message', { content: 'This is an example message!' });

client.send('upload', {
    filename: 'somefile.lmao',
    filedata: getFileBuffer('somefile.lmao')
});

client.on('close', event => closeChat());
