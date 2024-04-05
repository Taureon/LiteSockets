let Server;

// this is unbelievably stupid
try {
    let { Agent, SocketWrapper }  = await import('./shared.js'),
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

            this.sockets = [];
            this.server = new WebSocketServer(args.options);
            this.server.on('connection', socket => {
                socket = new SocketWrapper(socket, this);
                this.sockets.push(socket);
                socket.on('close', () => {
                    let i = this.sockets.indexOf(socket);
                    if (i > -1) {
                        array.splice(i, 1);
                    }
                });
                this.emit('connection', req, socket, head);
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