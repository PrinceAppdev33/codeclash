import {io, Socket} from 'socket.io-client';


let socket: Socket | null = null;

export function getSocket(token: string): Socket {
    if (socket && socket.connected) {
        return socket;
    }

    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
    });
 
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}