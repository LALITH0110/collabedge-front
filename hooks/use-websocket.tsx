"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface WebSocketHook {
  isConnected: boolean
  lastMessage: MessageEvent | null
  sendMessage: (message: string | ArrayBuffer) => void
  error: Event | null
  reconnect: () => void
}

/**
 * Custom hook for WebSocket connections
 * @param url The WebSocket URL to connect to
 * @returns WebSocket state and methods
 */
export function useWebSocket(url: string): WebSocketHook {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null)
  const [error, setError] = useState<Event | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 3 // Reduced from 10
  
  // Create a function to connect to WebSocket that we can reuse
  const connectToWebSocket = useCallback(() => {
    // Skip WebSocket connection during SSR
    if (typeof window === 'undefined') {
      console.log('Skipping WebSocket connection during SSR');
      return null;
    }
    
    // Don't attempt to connect if URL is invalid
    if (!url || url === 'undefined') {
      console.log(`Invalid WebSocket URL: ${url}`);
      return null;
    }
    
    // Don't reconnect if we've exceeded max attempts
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Stopping reconnection.`);
      return null;
    }
    
    console.log(`Connecting to WebSocket: ${url} (attempt ${reconnectAttempts + 1})`);
    
    // Close any existing connection before creating a new one
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
      socketRef.current.close();
    }

    let ws: WebSocket | null = null;
    
    try {
      ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      socketRef.current = ws;

      ws.onopen = () => {
        console.log(`✅ WebSocket connected successfully`);
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          setLastMessage(event);
          console.log(`📨 WebSocket message received:`, event.data.substring(0, 100));
        } catch (err) {
          console.error(`Error processing WebSocket message:`, err);
        }
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected (code: ${event.code}, clean: ${event.wasClean})`);
        setIsConnected(false);
        
        // Only reconnect if it wasn't a clean close and we haven't exceeded max attempts
        if (!event.wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * (reconnectAttempts + 1), 5000); // Max 5 second delay
          console.log(`🔄 Reconnecting in ${delay}ms...`);
          
          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connectToWebSocket();
          }, delay);
        } else {
          console.log(`❌ WebSocket connection failed. Not reconnecting.`);
        }
      };

      ws.onerror = (event) => {
        console.error(`❌ WebSocket error:`, event);
        setError(event);
      };

      setSocket(ws);
    } catch (err) {
      console.error(`WebSocket connection error:`, err);
      setError(err as Event);
    }
    
    return ws;
  }, [url, reconnectAttempts]);

  // Connect to the WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    if (url) {
      ws = connectToWebSocket();
    }

    // Clean up function to close the WebSocket when the component unmounts
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    }
  }, [url, connectToWebSocket]);

  // Manual reconnection function
  const reconnect = useCallback(() => {
    console.log(`Manual reconnection requested`);
    setReconnectAttempts(0);
    if (socketRef.current) {
      socketRef.current.close();
    }
    connectToWebSocket();
  }, [connectToWebSocket]);

  // Send message function
  const sendMessage = useCallback(
    (message: string | ArrayBuffer) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(message);
        console.log(`📤 Sent WebSocket message`);
      } else {
        console.warn(`⚠️ WebSocket is not connected. Message not sent.`);
      }
    },
    [],
  )

  return { isConnected, lastMessage, sendMessage, error, reconnect }
}
