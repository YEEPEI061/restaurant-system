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

    const message =
        JSON.stringify(data);

    webSocketServer.clients.forEach((client) => {

        if (
            client.readyState ===
            WebSocket.OPEN
        ) {
            client.send(message);
        }

    });
}

module.exports = {
    initializeWebSocket,
    broadcast
};