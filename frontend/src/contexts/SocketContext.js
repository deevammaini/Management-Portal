import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:8000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      setIsConnected(true);
      
      // Join admin room for targeted updates
      newSocket.emit('join_room', { room: 'admin' });
      console.log('🏠 Joined admin room');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('✅ WebSocket connection confirmed:', data.message);
    });

    newSocket.on('joined_room', (data) => {
      console.log('🏠 Joined room:', data.room);
    });

    // Database change event handler
    newSocket.on('database_change', (data) => {
      console.log('📡 Received database change via WebSocket:', data);
      
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('databaseChange', {
        detail: data
      }));
      console.log('📢 Dispatched databaseChange event to components');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    emit: (event, data) => socket?.emit(event, data),
    on: (event, callback) => socket?.on(event, callback),
    off: (event, callback) => socket?.off(event, callback),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
