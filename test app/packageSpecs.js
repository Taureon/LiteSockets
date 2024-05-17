// You don't NEED a shared file between the client and server,
// but it makes it very easy to keep server and client packets
// synced if you want to change/add/remove something.

// You can use variables to make sure the data type for something stays consistent
const teamIdType = 'Uint16',
    nameType = 'String8',
    contentType = 'StringRemaining';

// Packages, that the Client sends to the Server
let clientPackages = [
    // client should send those when it successfully connects or receives a 'pong' packet
    // the delay between ping and pong is the latency times 2
    // if didn't receive this packet for over 15 seconds, timeout kick
    ['ping'],

    // clients and servers keep track of the "lobbies" (different channels in the chat) via 16 bit IDs
    ['switchTeam', teamIdType],

    // clients can set their names literally whenever
    ['setName', nameType],

    // clients can send chat messages to everyone
    ['sendMessage', contentType],

    // clients can send chat messages to their team
    ['sendTeamMessage', contentType]
],

// Packages, that the Server sends to the Client
serverPackages = [
    // send this packet back if 'ping' is received
    // if didn't receive this packet for over 15 seconds, timeout kick
    ['pong'],

    // send a message
    ['message', 'Struct', [
        ['name', nameType],
        ['nameColor', 'String8'],
        ['content', contentType]
    ]],

    // send a message to the team
    ['teamMessage', 'Struct', [
        ['name', nameType],
        ['nameColor', 'String8'],
        ['content', contentType]
    ]]
];

export { clientPackages, serverPackages };