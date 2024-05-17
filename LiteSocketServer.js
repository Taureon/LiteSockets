let Server;

// this is unbelievably stupid
// we are basically acting like we are in a server environment and if something rightfully throws an error, it means we arent
try {
    let { SocketWrapper } = await import('./shared.js'),
        { WebSocketServer } = await import('ws'),
        { EventEmitter } = await import('events');

    Server = class Server extends EventEmitter {
        constructor(args) {
            if ('object' != typeof args) {
                throw new Error("First argument is not an object!");
            }
            if ('object' != typeof args.options) {
                throw new Error("Attribute 'options' is not an object!");
            }
            if (('port' in args.options) + ('server' in args.options) + ('noServer' in args.options) !== 1) {
                throw new Error("Attribute 'options' must have one and only one of the following options specified:" +
                                "\n port (must be a number)" +
                                "\n server (must be a http.Server or https.Server)" +
                                "\n noServer (must be true)");
            }
            super();
            this.serverPackages = args.serverPackages;
            this.clientPackages = args.clientPackages;

            this.sockets = [];
            this.server = new WebSocketServer(args.options);
            this.server.on('connection', socket => {
                socket = new SocketWrapper(socket, this);
                this.sockets.push(socket);
                socket.on('close', () => {
                    let i = this.sockets.indexOf(socket);
                    if (i > -1) {
                        this.sockets.splice(i, 1);
                    }
                });
                this.emit('connection', socket);
            });
            this.server.on('error', event => this.emit('error', event));
        }

        broadcast (type, data, filter = socket => true) {
            for (let i = 0; i < this.sockets.length; i++) {
                if (filter(this.sockets[i])) {
                    this.sockets[i].send(type, data);
                }
            }
        }

        close (...args) {
            this.server.close(...args);
        }
    }

} catch (err) {
    Server = class Server {
        constructor () {
            throw new Error('Where are you trying to run this server in? This was made for Node.js');
        }
    }
}

export { Server };