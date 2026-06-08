import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => socket;

export const connectSocket = () => {
  const token = useAuthStore.getState().getToken();
  if (!token || socket?.connected) return;

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
