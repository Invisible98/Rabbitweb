import { useEffect, useRef, useState } from 'react';
import { Bot, LogEntry } from '@shared/schema';

interface SocketEvents {
  botConnected: (bot: Bot) => void;
  botDisconnected: (bot: Bot) => void;
  botUpdated: (bot: Bot) => void;
  newLog: (log: LogEntry) => void;
  aiResponse: (data: { response: string; originalMessage: string }) => void;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Partial<SocketEvents>>({});

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.CLOSED) {
          const newSocket = new WebSocket(wsUrl);
          socketRef.current = newSocket;
          // Re-setup event handlers (this will be handled by the useEffect dependency)
        }
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const { event: eventType, data } = JSON.parse(event.data);
        setLastMessage({ event: eventType, data, timestamp: Date.now() });
        
        // Call registered listeners
        const listener = listenersRef.current[eventType as keyof SocketEvents];
        if (listener) {
          (listener as any)(data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const on = <K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]) => {
    listenersRef.current[event] = listener;
  };

  const off = <K extends keyof SocketEvents>(event: K) => {
    delete listenersRef.current[event];
  };

  const send = (event: string, data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event, data }));
    }
  };

  return {
    isConnected,
    lastMessage,
    on,
    off,
    send
  };
}
