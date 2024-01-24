let decrypt, encrypt,
    isNode = typeof module != 'undefined',

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
    encrypt = decrypt = () => throw new Error("Browser-side cryptography has not been implemented yet!");
}

class Agent extends {
    constructor ({ connection, structsReceive, structsSend, key, ivLength = 12 }) {
        this.connection = connection;
        this.structsReceive = dictifyStruct(structsReceive);
        this.structsSend = dictifyStruct(structsSend);
        this.key = key;
        this.ivLength = ivLength;

        this.structsReceive_mapIdToName = structsReceive.map(([x], i) => [i, x]);
        this.structsSend_mapNameToId = Object.fromEntries(structsSend.map(([x], i) => [x, i]));

        this.connection.binaryType = 'arraybuffer';
        this.connection.onopen = event => this.emit('open', event);
        this.connection.onmessage = msg => {
            let message = new Uint8Array(msg.data);

            if (this.key) {
                message = this.decrypt(message);
            }

            message = new Reader(message.buffer);

            let id = this.structsReceive_mapIdToName[message.Uint8()];

            this.emit(id, this.parse(id, message));
        };
        this.connection.onerror = event => this.emit('error', event);
        this.connection.onclose = event => this.emit('close', event);
    }

    serialise (id, data) {
        let [type, ...argument] = this.structsSend[id];

        return new Builder()
            .Uint8(this.structsSend_mapNameToId[id])
            [type](data, ...argument) // 500 iq method chaining
            .finish();
    }
    parse (id, reader) {
        let [type, ...argument] = this.structsReceive[id];
        return reader[type](...argument);
    }

    encrypt (buffer) {
        return encrypt(
            new Builder()
                .Uint8(makeChecksum(buffer))
                .Buffer(buffer),
        this.key, this.ivLength);
    }
    decrypt (buffer) {
        let reader = new Reader(decrypt(buffer, this.key, this.ivLength)),
            checksum = reader.Uint8();
        buffer = reader.BufferRemaining();
        if (checksum == makeChecksum(buffer)) {
            throw new Error("Decrypted checksum mismatch!");
        }
        return buffer;
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