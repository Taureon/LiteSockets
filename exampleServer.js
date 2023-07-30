import { Server as LSServer, DataTypes as LSDataTypes } from "LiteSocketServer.js";

// Packages, that the Client sends to the Server
let clientPackages = {
        message: {
            content: LSDataTypes.String8
        },
        upload: {
            filename: LSDataTypes.String8,
            filedata: LSDataTypes.Buffer32
        }
    },

    // Packages, that the Server sends to the Client
    serverPackages = {
        status: {
            playerCount: LSDataTypes.Int16,
            motd: LSDataTypes.String32
        },
        message: {
            name: LSDataTypes.String8,
            content: LSDataTypes.String8
        },
        download: {
            filename: LSDataTypes.String8,
            filedata: LSDataTypes.Buffer32
        }
    },

    // Creates a new server on port 8080
    server = new LSClient({
        options: { port: 8080 },
        serverPackages,
        clientPackages
    });

// Someone has connected! Let's let them join the chat room!
server.on('connection', (req, socket) => {

    // Everyone will be called Anonymousrandomnumbers
    const username = 'Anonymous' + Math.random().toString().slice(2);

    // Send a nice welcome message :D
    socket.send('message', {
        name: 'Server',
        content: `hello ${username}!`
    });

    // They are uploading a file to other people in the chatroom
    socket.on('upload', upload => {

        // Turn dangerous files into text files
        let fn = upload.filename.split('.');
        if (['exe', 'scr', 'bat', 'ps1'].includes(fn[fn.length - 1])) {
            fn[fn.length - 1] = 'txt';
        }

        // Send file to everyone else
        server.broadcast('download', {
            filename: fn.join('.'),
            filedata: upload.filedata
        });
    });

    // They wanna say something
    socket.on('message', msg => {

        // Filter out bad words
        if (msg.content.includes('bad words')) return;

        // Broadcast message to everyone else
        server.broadcast('message', {
            name: username,
            content: msg.content
        });
    });
});

// Time difference formatting code: https://stackoverflow.com/a/26580696/10793061
const bootup = Date.now(),
    format = x => x.toString().length == 1 ? '0' + x : x;

// Update server status once a second
setInterval(() => {
    let secs = (Date.now() - bootup) / 1000 | 0,
        timestring = `${format(secs / 3600 | 0)} hours, ${format((secs % 3600) / 60 | 0)} minutes and ${format(secs % 60)} seconds`;

    // Sometimes, I find chats which don't display how many people are currently connected, which makes me sad :(
    server.broadcast('status', {
        playerCount: server.sockets.length,
        motd: `Running for ${timestring}!`
    });

}, 1000);