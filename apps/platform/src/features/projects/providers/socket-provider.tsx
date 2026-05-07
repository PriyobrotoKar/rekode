import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { socketEventBus } from '../lib/socket-event-bus';

interface SocketContextProps {
  subscribe: (event: string, cb: (payload: any) => void) => void;
  send: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextProps | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);

  const subscribe = (event: string, cb: (payload: any) => void) =>
    socketEventBus.addListener(event, cb);

  const send = (event: string, data: any) => {
    if (!socketRef.current) return;

    if (socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(JSON.stringify({ namespace: event, payload: data }));
  };

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9999');

    socketRef.current = ws;

    ws.onmessage = (e) => {
      const parsed = JSON.parse(e.data);

      if (!parsed.namespace) return;

      socketEventBus.emit(parsed.namespace, parsed.payload);
    };

    return () => ws.close();
  }, []);

  return (
    <SocketContext.Provider
      value={{
        subscribe,
        send,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);

  if (!socket) throw new Error('useSocket must be used within a SocketProvider');

  return socket;
}
