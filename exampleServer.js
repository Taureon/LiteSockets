import { Server as LSServer } from "LiteSocketServer.js";

// Packages, that the Client sends to the Server
let clientPackages = {
    message: {
        content: 'String8'
    },
    upload: {
        filename: 'String8',
        filedata: 'Buffer32'
    }
},

// Packages, that the Server sends to the Client
serverPackages = {
    status: {
        playerCount: 'Int16',
        motd: 'String32'
    },
    message: {
        name: 'String8',
        content: 'String8'
    },
    download: {
        filename: 'String8',
        filedata: 'Buffer32'
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

const bootup = Date.now(),
    format = x => Math.floor(x).toString().padStart(2, '0');

// Update server status once a second
setInterval(() => {
    let secs = (Date.now() - bootup) / 1000,
        mins = secs / 60,
        hours = mins / 60,
        timestring = `${format(hours)} hours, ${format(mins % 60)} minutes and ${format(secs % 60)} seconds`;

    server.broadcast('status', {
        playerCount: server.sockets.length,
        motd: `Running for ${timestring}!`
    });

}, 1000);