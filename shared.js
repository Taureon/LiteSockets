import { Builder } from './Walker/builder.js';
import { Reader } from './Walker/reader.js';

let decrypt, encrypt, EventEmitter,
    isNode = typeof window == 'undefined',
    crypto = isNode ? await import('crypto') : window.crypto,

makeChecksum = buffer => {
    let final = 0;
    for (let i = 0; i < buffer.length; i++) {
        final ^= buffer[i];
    }
    return final;
},

dictifyStruct = struct => {
    let dict = {};
    for (let [key, ...data] of struct) {
        dict[key] = data;
    }
    return dict;
};

if (isNode) {
    EventEmitter = (await import('events')).EventEmitter;

    encrypt = (buffer, key, ivLength) => new Promise(Resolve => {
        let iv = crypto.randomBytes(ivLength),
            cipher = crypto.createCipheriv('aes-256-cbc', key, iv),
            encrypted = cipher.update(buffer);

        Resolve(new Builder()
            .Buffer(iv)
            .Buffer(encrypted)
            .Buffer(cipher.final())
            .finish()
        );
    });

    decrypt = (buffer, key, ivLength) => new Promise(Resolve => {
        let reader = new Reader(buffer),
            decipher = crypto.createDecipheriv('aes-256-cbc', key, reader.Buffer(ivLength)),
            decrypted = decipher.update(reader.BufferRemaining());

        Resolve(new Builder()
            .Buffer(decrypted)
            .Buffer(decipher.final())
            .finish()
        );
    });

} else {
    encrypt = (buffer, key, ivLength) => new Promise(Resolve => {
        let iv = crypto.getRandomValues(new Uint8Array(ivLength));
        crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, buffer)
            .then(encrypted => Resolve(new Builder() .Buffer(iv) .Buffer(encrypted) .finish() ));
    });

    decrypt = (buffer, key, ivLength) => new Promise(Resolve => {
        let reader = new Reader(buffer);
        crypto.subtle.decrypt({ name: "AES-CBC", iv: reader.Buffer(ivLength) }, key, reader.BufferRemaining())
            .then(decrypted => Resolve(decrypted));
    });

    EventEmitter = class {
        constructor () {
            this.callbacks = {};
        }
        on (event, callback) {
            if (!this.callbacks[event]) this.callbacks[event] = [];
            this.callbacks[event].push(callback);
        }
        emit (event, ...data) {
            if (this.callbacks[event]) for (let i = 0; i < this.callbacks[event].length; i++) this.callbacks[event][i](...data);
        }
    };
}

class Agent extends EventEmitter {
    constructor ({ connection, structsReceive, structsSend, key, ivLength = 12 }) {
        super();
        this.connection = connection;
        this.structsReceive = dictifyStruct(structsReceive);
        this.structsSend = dictifyStruct(structsSend);
        this.key = key;
        this.ivLength = ivLength;

        if (this.key && !isNode) {
            window.crypto.subtle.importKey('raw', this.key, 'AES-CBC', false, ['encrypt', 'decrypt']).then(key => this.key = key);
        }

        this.structsReceive_mapIdToName = Object.fromEntries(structsReceive.map(([x], i) => [i, x]));
        this.structsSend_mapNameToId = Object.fromEntries(structsSend.map(([x], i) => [x, i]));

        this.connection.binaryType = 'arraybuffer';
        this.connection.onopen = event => this.emit('open', event);
        this.connection.onmessage = msg => {
            this.decrypt(msg.data).then(result => {

                let message = new Reader(result.buffer),
                    id = this.structsReceive_mapIdToName[message.Uint8()];

                this.emit(id, this.parse(id, message));
            });
        };
        this.connection.onerror = event => this.emit('error', event);
        this.connection.onclose = event => this.emit('close', event);
    }

    serialise (id, data) {
        let [type, ...argument] = this.structsSend[id];
        
        let packet = new Builder();
        packet.Uint8(this.structsSend_mapNameToId[id]);
        
        if (type) {
            packet[type](data, ...argument);
        }

        return packet.finish();
    }

    parse (id, reader) {
        let [type, ...argument] = this.structsReceive[id];

        if (type) {
            let info = reader[type](...argument);
            return info;
        }
    }

    encrypt (buffer) {
        if (!this.key) {
            return new Promise(Resolve => Resolve(buffer));
        }

        return encrypt(
            new Builder()
                .Uint8(makeChecksum(buffer))
                .Buffer(buffer),
        this.key, this.ivLength);
    }

    async decrypt (buffer) {
        if (!this.key) {
            return buffer;
        }

        let reader = new Reader(await decrypt(buffer, this.key, this.ivLength)),
            checksum = reader.Uint8();
        buffer = reader.BufferRemaining();
        if (checksum === makeChecksum(buffer)) {
            throw new Error("Decrypted checksum mismatch!");
        }
        return buffer;
    }

    send (id, data) {
        if (this.connection.readyState !== this.connection.OPEN) return;

        this.encrypt(this.serialise(id, data))
            .then(buffer => this.connection.send(buffer));
    }

    close (code, reason) {
        this.connection.close(code, reason);
    }
}

// import { Server } from './LiteSocketServer.js';

class SocketWrapper extends Agent {
    constructor (wsSocket, lsServer) {
        super({
            connection: wsSocket,
            structsReceive: lsServer.clientPackages,
            structsSend: lsServer.serverPackages,
            key: lsServer.key
        });
        // idk how to check if this is an instanceof Server without circular imports so we just kinda have to trust that it is
        this.server = lsServer;//lsServer instanceof Server ? lsServer : null;
    }
}

export { Agent, SocketWrapper };