/* jshint esversion: 11 */
let { WebSocketServer } = require('ws'),
    EventEmitter = require('events'),

bitsizemask = 0b11000,
bitSize08   = 0b00000,
bitSize16   = 0b01000,
bitSize32   = 0b10000,
bitSize64   = 0b11000,

typemask    = 0b00111,
typeInt     = 0b00000,
typeUint    = 0b00001,
typeFloat   = 0b00010,
typeBigInt  = 0b00011,
typeBigUint = 0b00100,
typeBuffer  = 0b00101,
typeString  = 0b00110,

dataTypes = {
    BigInt64 : bitSize64 | typeBigInt ,
    BigUint64: bitSize64 | typeBigUint,
    Float32  : bitSize32 | typeFloat  ,
    Float64  : bitSize64 | typeFloat  ,
    Int08    : bitSize08 | typeInt    ,
    Int16    : bitSize16 | typeInt    ,
    Int32    : bitSize32 | typeInt    ,
    Uint08   : bitSize08 | typeUint   ,
    Uint16   : bitSize16 | typeUint   ,
    Uint32   : bitSize32 | typeUint   ,
    Buffer08 : bitSize08 | typeBuffer ,
    Buffer16 : bitSize16 | typeBuffer ,
    Buffer32 : bitSize32 | typeBuffer ,
    Buffer64 : bitSize64 | typeBuffer ,
    String08 : bitSize08 | typeString ,
    String16 : bitSize16 | typeString ,
    String32 : bitSize32 | typeString ,
    String64 : bitSize64 | typeString
},

dataSizes = {
    [dataTypes.BigInt64]: 8n,
    [dataTypes.BigUint64]: 8n,
    [dataTypes.Float32]: 4n,
    [dataTypes.Float64]: 8n,
    [dataTypes.Int08]: 1n,
    [dataTypes.Int16]: 2n,
    [dataTypes.Int32]: 4n,
    [dataTypes.Uint08]: 1n,
    [dataTypes.Uint16]: 2n,
    [dataTypes.Uint32]: 4n,

    // For Buffer and String, the size refers to how large the length header is
    [dataTypes.Buffer08]: 1n,
    [dataTypes.Buffer16]: 2n,
    [dataTypes.Buffer32]: 4n,
    [dataTypes.Buffer64]: 8n,
    [dataTypes.String08]: 1n,
    [dataTypes.String16]: 2n,
    [dataTypes.String32]: 4n,
    [dataTypes.String64]: 8n
},

typeToString = {
    [typeBigInt]: 'BigInt',
    [typeBigUint]: 'BigUint',
    [typeFloat]: 'Float',
    [typeInt]: 'Int',
    [typeUint]: 'Uint',
},

textDecoder = new TextDecoder(),
textEncoder = new TextEncoder(),

validatePackage = (chunkName, chunkData, chunkType) => {
    if (!(chunkType in dataSizes)) {
        throw new LiteSocketError(`${chunkName} is of type ${chunkType} which is not a valid data type!`);
    }
    if (undefined == chunkData) {
        throw new LiteSocketError(`Server Package ${chunkName}'s property ${chunkName} can't be undefined!`);
    }
    if (isNaN(chunkData)) {
        throw new LiteSocketError(`Server Package ${chunkName}'s property ${chunkName} can't be NaN!`);
    }
    if (null == chunkData) {
        throw new LiteSocketError(`Server Package ${chunkName}'s property ${chunkName} can't be null!`);
    }
    if (chunkType & typeBuffer && !(chunkData instanceof Uint8Array)) {
        throw new LiteSocketError(`Server Package ${chunkName}'s property ${chunkName} isn't an instance of Uint8Array!`);
    }
    if (chunkType & typeString && "string" == typeof chunkData) {
        throw new LiteSocketError(`Server Package ${chunkName}'s property ${chunkName} is not a string!`);
    }
},

getKeysSorted = x => Object.keys(x).sort(),

sortKeys = obj => {
    let ret = {};
    for (let key of getKeysSorted(obj)) {
        ret[key] = obj[key];
    }
    return ret;
},

sortSubObjs = obj => {
    let ret = {};
    for (let key of obj) {
        ret[key] = sortKeys(obj[key]);
    }
    return ret;
},

typeToDataViewMethod = (type, isSet) => {
    for (let key of typeToString) {
        if (type & typemask === key) {
            return (isSet ? 'set' : 'get') + typeToString[key];
        }
    }
},

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
};

class LiteSocketError extends Error {
    constructor (error) {
        super('LiteSocket Error: ' + error);
    }
}

class SocketWrap extends EventEmitter {
    constructor (wsSocket, lsServer) {
        super();
        this.socket = wsSocket;
        this.server = lsServer;

        this.socket.binaryType = 'arraybuffer';
        this.socket.on('open', event => this.emit('open', event));
        this.socket.on('message', msg => {
            let message = new Uint8Array(msg.data);

            if (this.server.useEncryption) {
                message = this.decrypt(message);
            }

            let type = this.server.clientPackagesToKey[message[0]],
                data = this.parsePackage(type, message.slice(1));

            this.emit(type, data);
        });
        this.socket.on('error', event => this.emit('error', event));
        this.socket.on('close', event => this.emit('close', event));
    }

    parsePackage (type, data) {
        let dataView = new DataView(data),
            specs = this.server.clientPackages[type],
            parsed = {},
            offset = 0n;
        for (let label in specs) {
            let type = specs[label],
                typeLength = dataSizes[type],
                isString = type & typeString;

            if (isString || type & typeBuffer) {

                // Figure out how long the buffer is
                let finalLength = 0n;
                for (let i = offset; i < offset + typeLength; i++) {
                    finalLength = finalLength << 8n + BigInt(dataView.getUint8(i));
                }

                // Actually get the buffer
                let start = parseInt(offset += typeLength),
                    end = parseInt(offset += finalLength),
                    buff = data.slice(start, end);

                // Decode buffer if its string data and save it
                parsed[label] = isString ? textDecoder.decode(buff) : buff;

            // Handle normal data
            } else {
                parsed[label] = dataView[typeToDataViewMethod(type)](parseInt(offset));
                offset += typeLength;
            }

            // Someone is forging packets, probably
            // Or we just screwed up somewhere in the bufferfying process on the other side
            if (offset > data.length) {
                throw LiteSocketError("Suspicious packet processing error.");
            }
        }
        return parsed;
    }

    bufferfyPackage (type, data) {
        let buffs = [new Uint8Array([this.server.serverPackagesToIndex[type]])],
            packageSpecs = this.server.serverPackages[type];

        for (let name in packageSpecs) {
            let chunkData = data[name],
                chunkType = packageSpecs[name],
                typeLength = dataSizes[type],
                isString = type & typeString;

            validatePackage(name, chunkData, chunkType);

            if (isString || type & typeBuffer) {

                // Decode buffer if it is string data
                chunkData = isString ? textEncoder.encode(chunkData) : chunkData;
                buffs.push(new Uint8Array([chunkData.length]));

                buffs.push(appendBuff);

            // Handle data that DataView already has tools for
            } else {
                let appendBuff = new Uint8Array(typeLength);
                new DataView(appendBuff)[typeToDataViewMethod(type, true)](0, chunkData);
                buffs.push(appendBuff);
            }

        }

        // Merge all buffers into one
        let resultLength = 0;
        for (let buff of buffs) {
            resultLength += buff.length;
        }
        let resultBuff = new Uint8Array(resultLength),
            offset = 0;
        for (let buff of buffs) {
            resultBuff.set(buff, offset);
            offset += buff.length;
        }
        return resultBuff;
    }

    encrypt (buffer) {
        // TODO: ADD CHECKSUM AND ENCRYPTION
        return buffer;
    }

    decrypt (buffer) {
        // TODO: ADD DECRYPTION AND SUMCHECK
        return buffer;
    }

    send (type, data) {
        if (this.socket.readyState !== webSocket.OPEN) return;

        let buffer = this.bufferfyPackage(type, data);

        if (this.server.useEncryption) {
            buffer = this.encrypt(buffer);
        }

        this.socket.send(buffer);
    }

    close (code, reason) {
        this.socket.close(code, reason);
    }
}

class LiteSocketServer extends EventEmitter {
    constructor(args) {
        super();

        if ('object' != typeof args) {
            throw new LiteSocketError("First argument is not an object!");
        }
        if ('object' != typeof args.clientPackages) {
            throw new LiteSocketError("Option 'clientPackages' is not an object or is not defined!");
        }
        if ('object' != typeof args.serverPackages) {
            throw new LiteSocketError("Option 'serverPackages' is not an object or is not defined!");
        }
        if (args.useEncryption && !(args.encryptionKey instanceof CryptoKey)) {
            throw new LiteSocketError("Option 'encryptionKey' is not an instance of CryptoKey!");
        }
        if ('object' != typeof args.options) {
            throw new LiteSocketError("Option 'options' is not an object!");
        }
        if (('port' in args.options) + ('server' in args.options) + ('noServer' in args.options) === 1) {
            throw new LiteSocketError("Option 'options' must have one and only one of the following options specified:" +
                                    "\n port (must be a number)" +
                                    "\n server (must be a http.Server or https.Server)" +
                                    "\n noServer (must be true)");
        }

        let clientKeys = getKeysSorted(args.clientPackages),
            serverKeys = getKeysSorted(args.serverPackages);

        this.clientPackages = sortSubObjs(args.clientPackages);
        this.clientPackagesToKey = {};
        for (let i = 0; i < clientKeys.length; i++) {
            this.clientPackagesToKey[i] = clientKeys[i];
        }

        this.serverPackages = sortSubObjs(args.serverPackages);
        this.serverPackagesToIndex = {};
        for (let i = 0; i < serverKeys.length; i++) {
            this.serverPackagesToIndex[serverKeys[i]] = i;
        }

        this.useEncryption = args.useEncryption;
        this.encryptionKey = args.encryptionKey;

        this.options = args.options;
        this.sockets = [];
        this.server = new WebSocketServer(this.options);
        this.server.on('connection', socket => {
            socket = new SocketWrap(socket, this);
            this.sockets.push(socket);
            socket.on('close', () => {
                let i = this.sockets.indexOf(socket);
                if (i > -1) {
                    array.splice(i, 1);
                }
            });
            this.emit('connection', req, socket, head);
        });
        this.server.on('error', event => this.emit('error', event));
    }

    broadcast (type, data, filter = socket => true) {
        for (let i = 0; i < this.sockets.length; i++) {
            if (filter(this.sockets[i])) {
                this.sockets[i].send(type, data);
            }
        }
    }
}

if (module) {
    module.exports = { Server: LiteSocketServer, DataTypes: dataTypes };
} else {
    throw new LiteSocketError('Where are you trying to run this server in? This was made for Node.js');
}