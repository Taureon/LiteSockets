import { existsSync, createReadStream } from 'fs';
import { createServer } from 'http';
import { join as joinPaths } from 'path';

import { Server } from '../LiteSockets.js';
import { clientPackages, serverPackages } from './packageSpecs.js';

let mimeSet = {
    "js": "application/javascript",
    "css": "text/css",
    "html": "text/html"
},

// Create a new httpServer to be opened on port 8080 later
httpServer = createServer((req, res) => {
    let slashType = process.cwd().includes("\\") ? "\\" : "/";
    let fixPath = (path) => path.replaceAll("\\", slashType);

    let fileToGet = joinPaths(process.cwd(), req.url)
        .replace(fixPath('test app\\module\\'), '');

    //check if the file exists, and if it doesn't, return index.html instead;
    if (!existsSync(fileToGet) || fileToGet.lastIndexOf('.') < fileToGet.lastIndexOf(fixPath('\\'))) {
        fileToGet = joinPaths(process.cwd(), fixPath('.\\index.html'));
    }

    //return the file
    res.writeHead(200, { 'Content-Type': mimeSet[ fileToGet.split('.').pop() ] || 'text/html' });
    createReadStream(fileToGet).pipe(res);
}),

lsServer = new Server({
    options: { server: httpServer },
    serverPackages,
    clientPackages
});

function serverChatMessage(content) {
    lsServer.broadcast('message', { name: 'Server', nameColor: '#ffff00', content });
}

// Someone has connected! Let's let them join the chat room!
lsServer.on('connection', socket => {
    console.log('connection');
    
    // You can also just add custom things to the socket.
    socket.lastPingTime = Date.now();

    // Everyone will be called Anonymousrandomnumbers
    socket.username = 'Anonymous' + Math.random().toString().slice(2, 6);
    socket.usernameColor = ('#' + Math.floor(Math.random() * 16777216).toString(16)).padEnd(7, '0');
    console.log(socket.usernameColor);
    socket.teamId = 0;

    // Send a nice welcome message :D
    serverChatMessage(`A new user called ${socket.username} has joined!`);
    socket.send('message', { name: 'Server', nameColor: '#ffff00', content: 'Commands: /setTeam, /team, /setName' });

    socket.on('ping', () => {
        socket.lastPingTime = Date.now();
        socket.send('pong');
    });

    socket.on('setTeam', teamId => {
        let oldTeamId = socket.teamId;
        socket.teamId = teamId;
        serverChatMessage(`${socket.name} changed team from ${oldTeamId} to ${teamId}`);
    });

    socket.on('setName', newName => {
        let oldName = socket.username;
        socket.username = newName;
        serverChatMessage(`${oldName} from team ${socket.teamId} changed name to ${newName}`);
    });

    // They wanna say something
    socket.on('sendMessage', msg => {
        console.log(socket.username, ':', msg);

        // Filter out bad words
        if (msg.includes('bad words')) return;

        // Broadcast message to everyone else
        lsServer.broadcast('message', {
            name: socket.username,
            nameColor: socket.usernameColor,
            content: msg
        });
    });

    // They wanna say something secretly
    socket.on('sendTeamMessage', msg => {

        // Filter out bad words
        if (msg.includes('bad words')) return;

        // Broadcast message to everyone else *on the team*
        lsServer.broadcast('teamMessage', {
            name: socket.username,
            nameColor: socket.usernameColor,
            content: msg
        }, s => s.teamId === socket.teamId);
    });

    socket.on('close', () => {
        serverChatMessage(`${socket.username} has left!`);
    })
});

//kick people who have not responded with a ping packet for 15 seconds
setInterval(() => {
    for (let socket of lsServer.sockets) {
        if (Date.now() - socket.lastPingTime > 15_000) {
            socket.close();
        }
    }
}, 1000);

httpServer.listen(8080, () => console.log('listening on port 8080'));