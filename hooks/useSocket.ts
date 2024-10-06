import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have an auth hook

const SOCKET_URL = 'YOUR_SOCKET_SERVER_URL'; // Replace with your actual WebSocket server URL

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token } = useAuth(); // Assuming you have an auth hook that provides the user's token

  useEffect(() => {
    // Only connect if we have an auth token
    if (token) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      setSocket(newSocket);

      // Cleanup function to disconnect socket when component unmounts
      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

  return socket;
}