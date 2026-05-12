import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { socketEventBus } from '../lib/socket-event-bus';

interface SocketContextProps {
  isReady: boolean;
  subscribe: (event: string, cb: (payload: any) => void) => () => void;
  send: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextProps | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isReady, setIsReady] = useState(false);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const BASE_RETRY_DELAY_MS = 1000;

  const subscribe = useCallback(
    (event: string, cb: (payload: any) => void) => socketEventBus.addListener(event, cb),
    [],
  );

  const send = useCallback((event: string, data: any) => {
    if (!socketRef.current) return;

    if (socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(JSON.stringify({ namespace: event, payload: data }));
  }, []);

  useEffect(() => {
    let isUnmounted = false;

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const connect = () => {
      if (isUnmounted) return;

      const ws = new WebSocket('ws://localhost:9999');
      socketRef.current = ws;

      ws.onopen = () => {
        if (socketRef.current !== ws) return;

        setIsReady(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (e) => {
        const parsed = JSON.parse(e.data);

        if (!parsed.namespace) return;

        socketEventBus.emit(parsed.namespace, parsed.payload);
      };

      ws.onerror = () => {
        if (socketRef.current !== ws) return;

        setIsReady(false);
      };

      ws.onclose = () => {
        if (socketRef.current !== ws) return;

        setIsReady(false);
        socketRef.current = null;

        if (isUnmounted || reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          return;
        }

        const nextAttempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = nextAttempt;
        const retryDelay = BASE_RETRY_DELAY_MS * nextAttempt;

        clearReconnectTimeout();

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, retryDelay);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      clearReconnectTimeout();
      socketRef.current?.close();
      socketRef.current = null;
      setIsReady(false);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        subscribe,
        send,
        isReady,
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
