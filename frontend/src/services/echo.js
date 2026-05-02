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
    const reverbHost   = process.env.REACT_APP_REVERB_HOST   || '127.0.0.1';
    const reverbPort   = parseInt(process.env.REACT_APP_REVERB_PORT   || '8080', 10);
    const reverbScheme = process.env.REACT_APP_REVERB_SCHEME || 'http';
    const reverbKey    = process.env.REACT_APP_REVERB_APP_KEY || 'rmjcp03lmoyfg1ocj9cb';
    const apiUrl       = process.env.REACT_APP_API_URL        || 'http://127.0.0.1:8000/api';
    const forceTLS     = reverbScheme === 'https';

    instance = new Echo({
        broadcaster:       'reverb',
        key:               reverbKey,
        wsHost:            reverbHost,
        wsPort:            reverbPort,
        wssPort:           reverbPort,
        forceTLS,
        enabledTransports: ['ws', 'wss'],
        authEndpoint:      `${apiUrl}/broadcasting/auth`,
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
