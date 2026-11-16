const WebSocket = require('ws');

let webSocketServer = null;

function initializeWebSocket(server) {
    webSocketServer = new WebSocket.Server({
        server,
        path: '/ws'
    });

    webSocketServer.on('connection', (socket) => {

        console.log('WebSocket client connected.');

        socket.send(
            JSON.stringify({
                type: 'connection',
                message: 'Connected to Aurelia real-time service.'
            })
        );

        socket.on('close', () => {
            console.log('WebSocket client disconnected.');
        });

        socket.on('error', (error) => {
            console.error(
                'WebSocket client error:',
                error
            );
        });
    });

    console.log(
        'Aurelia WebSocket server initialized at /ws'
    );
}

function broadcast(data) {

    if (!webSocketServer) {
        return;
    }

    const message = JSON.stringify(data);

    webSocketServer.clients.forEach((client) => {

        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }

    });
}

function closeWebSocket() {

    return new Promise((resolve, reject) => {

        if (!webSocketServer) {
            resolve();
            return;
        }

        const server = webSocketServer;

        server.clients.forEach((client) => {

            if (client.readyState === WebSocket.OPEN) {
                client.close(1001, 'Server shutting down');
            }

        });

        server.close((error) => {

            if (error) {
                reject(error);
                return;
            }

            webSocketServer = null;

            console.log('WebSocket server closed.');

            resolve();
        });
    });
}

module.exports = {
    initializeWebSocket,
    broadcast,
    closeWebSocket
};
