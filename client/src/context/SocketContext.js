import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      console.log('[SocketMock] Connected to notification stream for', user.email);
    }
    return () => {
      if (user) {
        console.log('[SocketMock] Disconnected from notification stream');
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected: false }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};
