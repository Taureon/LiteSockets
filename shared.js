class Agent {
    constructor (connection, structsIn, structsOut) {
        this.structsIn = structsIn;
        this.structsOut = structsOut;
    }
}

if (typeof module != "undefined") {
    module.exports = { Agent };
} else {
    window.LiteSockets = { Agent };
}
