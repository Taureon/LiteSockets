// You don't NEED a shared file between the client and server,
// but it makes it very easy to keep server and client packets
// synced if you want to change/add/remove something.



// Packages, that the Client sends to the Server
let clientPackages = [
    // client should send those when it successfully connects or receives a 'pong' packet
    // the delay between ping and pong is the latency times 2
    // if didn't receive this packet for over 15 seconds, timeout kick
    ['ping'],

    // clients and servers keep track of the "lobbies" (different channels in the chat) via 16 bit IDs
    ['switchLobby', 'Uint16'],

    // clients can set their names literally whenever
    ['setName', 'String8'],

    // clients can send chat messages to their current lobby
    ['sendMessage', 'String8'],

    // clients can also send small files over chat to others in the channel
    // those files only last for a few minutes
    ['upload', 'Struct', [
        ['filename', 'String8'],
        ['filedata', 'Buffer16']
    ]]
],

// Packages, that the Server sends to the Client
serverPackages = [
    // send this packet back if 'ping' is received
    // if didn't receive this packet for over 15 seconds, timeout kick
    ['pong'],

    // notify a client what their current lobby is
    ['currentLobby', 'Uint16'],

    // updates the client on how every lobby is going
    ['status', 'Array16', 'Struct', [
        ['id', 'Uint16'],
        ['playerCount', 'Uint16'],
        ['motd', 'String32']
    ]],

    // NOTE: finish
    ['message', 'Struct', [
        ['name', 'String8'],
        ['content', 'String8']
    ]],

    // NOTE: finish
    ['download', 'Struct', [
        ['filename', 'String8'],
        ['filedata', 'Buffer32']
    ]]
];

export { clientPackages, serverPackages };