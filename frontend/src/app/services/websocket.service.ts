import {
    Injectable,
    NgZone
} from '@angular/core';

import {
    Subject
} from 'rxjs';

import {
    environment
} from '../../environments/environment';

export interface WebSocketMessage {
    type: string;
    message?: string;
    data?: unknown;
}

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {

    private socket?: WebSocket;

    private messagesSubject =
        new Subject<WebSocketMessage>();

    messages$ =
        this.messagesSubject.asObservable();

    private reconnectAttempts = 0;

    constructor(
        private zone: NgZone
    ) { }

    connect(): void {

        if (
            this.socket &&
            (
                this.socket.readyState ===
                WebSocket.OPEN ||
                this.socket.readyState ===
                WebSocket.CONNECTING
            )
        ) {
            return;
        }

        // this.socket =
        //     new WebSocket(
        //         'ws://localhost:3000/ws'
        //     );

        let webSocketUrl =
            environment.websocketUrl;

        if (
            webSocketUrl.startsWith('/')
        ) {

            const protocol =
                window.location.protocol === 'https:'
                    ? 'wss:'
                    : 'ws:';

            webSocketUrl =
                `${protocol}//${window.location.host}${webSocketUrl}`;
        }

        this.socket =
            new WebSocket(
                webSocketUrl
            );

        this.socket.onopen = () => {

            console.log(
                'Connected to Aurelia WebSocket.'
            );

            this.reconnectAttempts = 0;
        };

        this.socket.onmessage =
            (event: MessageEvent) => {

                this.zone.run(() => {

                    try {

                        const data =
                            JSON.parse(event.data);

                        this.messagesSubject.next(data);

                    } catch (error) {

                        console.error(
                            'Invalid WebSocket message:',
                            error
                        );

                    }

                });

            };

        this.socket.onclose = () => {

            console.log(
                'Aurelia WebSocket disconnected.'
            );

            this.tryReconnect();
        };

        this.socket.onerror =
            (error) => {

                console.error(
                    'Aurelia WebSocket error:',
                    error
                );

            };
    }

    disconnect(): void {

        if (this.socket) {

            this.socket.close();

            this.socket =
                undefined;
        }
    }

    private tryReconnect(): void {

        if (
            this.reconnectAttempts >= 5
        ) {
            return;
        }

        this.reconnectAttempts++;

        const delay =
            Math.min(
                1000 *
                this.reconnectAttempts,
                5000
            );

        setTimeout(() => {

            this.connect();

        }, delay);
    }
}