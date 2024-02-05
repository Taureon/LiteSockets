// Packages, that the Client sends to the Server
let
clientPackages = {
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
};

export { clientPackages, serverPackages };