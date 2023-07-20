import { Client as LSClient, DataTypes as LSDataTypes } from "LiteSocketClient.js";

    //packages the client sends to the server
let clientPackages = {
        message: {
            content: LSDataTypes.String8
        },
        upload: {
            filename: LSDataTypes.String8,
            filedata: LSDataTypes.Buffer32
        }
    },

    //packages the server sends to the client
    serverPackages = {
        status: {
            playerCount: LSDataTypes.Int16,
            motd: LSDataTypes.String32
        },
        message: {
            id: LSDataTypes.Int32,
            name: LSDataTypes.String8,
            content: LSDataTypes.String8
        },
        download: {
            filename: LSDataTypes.String8,
            filedata: LSDataTypes.Buffer32
        }
    },

    client = new LSClient({
        url: 'wss://example.com/',
        serverPackages,
        clientPackages
    });

client.on('open', event => {
    openChat();
});

client.on('status', status => {
    updateMOTDText(status.motd);
    updatePlayerCountNumber(status.playerCount);
    updatePlayerCountColor(status.playerCount > 16 ? 'red' : 'yellow');
});

client.on('message', message => {
    console.log(`message received!\n${message.name}\n${message.content}\n${message.id}`)
    addMessageToChat(message);
});

client.on('download', download => {
    let file = new File(download.filedata, download.filename);
    downloadFile(file);
});

client.on('close', event => {
    closeChat();
});

client.send('message', {
    content: 'This is an example message!'
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
                // you can also do this:
                //filedata: new TextEncoder().encode('This is a text file!')
            });
        });
    }
});
