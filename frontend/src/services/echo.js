import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let instance = null;
let currentToken = null;

export function getEcho(token) {
    if (instance && currentToken === token) return instance;

    // Token changed or first call — disconnect stale instance and reinitialize
    if (instance) {
        instance.disconnect();
        instance = null;
    }

    currentToken = token;
    instance = new Echo({
        broadcaster:       'reverb',
        key:               'rmjcp03lmoyfg1ocj9cb',
        wsHost:            '127.0.0.1',
        wsPort:            8080,
        wssPort:           8080,
        forceTLS:          false,
        enabledTransports: ['ws', 'wss'],
        authEndpoint:      'http://127.0.0.1:8000/api/broadcasting/auth',
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept:        'application/json',
            },
        },
    });

    return instance;
}

export function disconnectEcho() {
    if (instance) {
        instance.disconnect();
        instance = null;
    }
}
