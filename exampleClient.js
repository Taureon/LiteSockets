import { Client as LSClient, DataTypes as LSDataTypes } from "LiteSocketClient.js";

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

    // Create new client that connects with 'wss://example.com/'
    client = new LSClient({
        url: 'wss://example.com/',
        serverPackages,
        clientPackages
    });

// We have connected, so we have to open chat and immediately send a message
client.on('open', event => {
    openChat();

    client.send('message', {
        content: 'This is an example message!'
    });
});

client.on('status', status => {
    updateMOTDText(status.motd);
    updatePlayerCountNumber(status.playerCount);
    updatePlayerCountColor(status.playerCount > 16 ? 'red' : 'yellow');
});

client.on('message', message => {
    console.log(`message received!\n${message.name}\n${message.content}`)
    addMessageToChat(message);
});

client.on('download', download => {
    let file = new File(download.filedata, download.filename);
    downloadFile(file);
});

client.on('close', event => {
    closeChat();
});

fileUpload.addEventListener('dragenter', event => event.preventDefault());
fileUpload.addEventListener('dragleave', event => event.preventDefault());
fileUpload.addEventListener('dragover', event => event.preventDefault());
fileUpload.addEventListener('drop', event => {
    event.preventDefault();

    for (let file of [...event.dataTransfer.files]) {
        file.arrayBuffer().then(buffer => {
            client.send('upload', {
                filename: file.name,
                filedata: buffer
                // You can also do this:
                // filedata: new TextEncoder().encode('This is a text file!')
            });
        });
    }
});
