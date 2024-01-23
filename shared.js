class Agent {}

if (typeof module != "undefined") {
    module.exports = { Agent };
} else {
    window.LiteSockets = { Agent };
}
