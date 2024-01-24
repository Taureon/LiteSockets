let decrypt, encrypt,
    isNode = typeof module != 'undefined';

dictifyStruct = struct => {
    let dict = {};
    for (let [key, ...data] of struct) {
        dict[key] = data;
    }
    return dict;
};

if (isNode) {
    let crypto = require('crypto');

    encrypt = (buffer, key, ivLength) => {
        let iv = crypto.randomBytes(ivLength),
            cipher = crypto.createCipheriv('aes-256-cbc', key, iv),
            encrypted = cipher.update(buffer);

        return new Builder()
            .Buffer(iv)
            .Buffer(encrypted)
            .Buffer(cipher.final())
            .finish();
    };

    decrypt = (buffer, key, ivLength) => {
        let reader = new Reader(buffer),
            decipher = crypto.createDecipheriv('aes-256-cbc', key, reader.Buffer(ivLength)),
            decrypted = decipher.update(reader.BufferRemaining());

        return new Builder()
            .Buffer(decrypted)
            .Buffer(decipher.final())
            .finish();
    };
} else {
    // TODO: implement this
    // https://github.com/mdn/dom-examples/blob/main/web-crypto/encrypt-decrypt/aes-cbc.js
    encrypt = () => throw new Error("Browser-side cryptography has not been implemented yet!");
    decrypt = () => throw new Error("Browser-side cryptography has not been implemented yet!");
}

class Agent extends {
    constructor ({ connection, structsReceive, structsSend, key, ivLength = 12 }) {
        this.connection = connection;
        this.structsReceive = dictifyStruct(structsReceive);
        this.structsSend = dictifyStruct(structsSend);
        this.key = key;
        this.ivLength = ivLength;

        this.structsReceive_MapIdToName = structsReceive.map(([x], i) => [i, x]);
        this.structsSend_MapNameToId = Object.fromEntries(structsSend.map(([x], i) => [x, i]));

        this.connection.onopen = event => this.emit('open', event);
        this.connection.onmessage = msg => {

            let message = new Uint8Array(msg.data);

            if (this.key) {
                message = this.decrypt(message);
            }

            message = new Reader(message.buffer);

            let id = this.structsReceive_MapIdToName[message.Uint8()];

            this.emit(id, this.parse(id, message));
        };
        this.connection.onerror = event => this.emit('error', event);
        this.connection.onclose = event => this.emit('close', event);
    }

    serialise (id, data) {
        let builder = new Builder(),
            [type, ...argument] = this.structsSend[id];
        builder.Uint8(this.structsSend_MapNameToId[id]);
        builder[type](data, ...argument);
        return builder.finish();
    }
    parse (id, reader) {
        let [type, ...argument] = this.structsReceive[id];
        return reader[type](...argument);
    }

    decrypt (buffer) {
        // decrypt buffer
        // get checksum
        // cry if checksum bad
        // return
    }
    encrypt (buffer) {
        // add checksum
        // encrypt buffer
        // return
    }

    send (id, data) {
        if (this.socket.readyState !== webSocket.OPEN) return;

        let buffer = this.serialise(id, data);

        if (this.key) {
            buffer = this.encrypt(buffer);
        }

        this.connection.send(buffer);
    }

    close (code, reason) {
        this.connection.close(code, reason);
    }
}

if (isNode) {
    module.exports = { Agent };
} else if (window.LiteSockets) {
    window.LiteSockets.Agent = Agent;
} else {
    window.LiteSockets = { Agent };
}