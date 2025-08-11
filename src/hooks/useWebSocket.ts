/**
 * React Hook for WebSocket Integration
 * Provides real-time collaboration features
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { wsClient } from '@/lib/websocket-client';

interface UseWebSocketOptions {
  showId?: string;
  userId?: string;
  onUpdate?: ($1: unknown) => void;
  onUserJoin?: (userId: string) => void;
  onUserLeave?: (userId: string) => void;
  onFormationAdd?: ($1: unknown) => void;
  onFormationRemove?: (formationId: string) => void;
  onFormationMove?: ($1: unknown) => void;
  onPlaybackSync?: ($1: unknown) => void;
  onCursorMove?: ($1: unknown) => void;
  onSelectionChange?: ($1: unknown) => void;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  activeUsers: string[];
  latency: number;
}

export function useWebSocket({
  showId,
  userId,
  onUpdate,
  onUserJoin,
  onUserLeave,
  onFormationAdd,
  onFormationRemove,
  onFormationMove,
  onPlaybackSync,
  onCursorMove,
  onSelectionChange,
}: UseWebSocketOptions = {}) {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    activeUsers: [],
    latency: 0,
  });

  const cleanup(...args: unknown[]) => unknowns = useRef<Array<() => void>>([]);
  const pingInterval = useRef<NodeJS.Timeout>();
  const lastPingTime = useRef<number>(0);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!userId) return;

    setState(prev => ({ ...prev, connecting: true, error: null }));
    wsClient.connect(userId);

    // Set up event listeners
    const unsubscribers: Array<() => void> = [];

    unsubscribers.push(
      wsClient.on('connected', () => {
        setState(prev => ({ ...prev, connected: true, connecting: false }));
        if (showId) {
          wsClient.joinShow(showId);
        }
      })
    );

    unsubscribers.push(
      wsClient.on('disconnected', () => {
        setState(prev => ({ ...prev, connected: false, activeUsers: [] }));
      })
    );

    unsubscribers.push(
      wsClient.on('error', (error) => {
        setState(prev => ({ ...prev, error: error.message, connecting: false }));
      })
    );

    unsubscribers.push(
      wsClient.on('show:state', (data) => {
        setState(prev => ({ ...prev, activeUsers: data.users }));
      })
    );

    if (onUpdate) {
      unsubscribers.push(wsClient.on('show:update', onUpdate));
    }

    if (onUserJoin) {
      unsubscribers.push(
        wsClient.on('show:user:joined', (data) => {
          setState(prev => ({
            ...prev,
            activeUsers: [...prev.activeUsers, data.userId],
          }));
          onUserJoin(data.userId);
        })
      );
    }

    if (onUserLeave) {
      unsubscribers.push(
        wsClient.on('show:user:left', (data) => {
          setState(prev => ({
            ...prev,
            activeUsers: prev.activeUsers.filter(id => id !== data.userId),
          }));
          onUserLeave(data.userId);
        })
      );
    }

    if (onFormationAdd) {
      unsubscribers.push(wsClient.on('show:formation:add', onFormationAdd));
    }

    if (onFormationRemove) {
      unsubscribers.push(wsClient.on('show:formation:remove', onFormationRemove));
    }

    if (onFormationMove) {
      unsubscribers.push(wsClient.on('show:formation:move', onFormationMove));
    }

    if (onPlaybackSync) {
      unsubscribers.push(wsClient.on('show:playback:sync', onPlaybackSync));
    }

    if (onCursorMove) {
      unsubscribers.push(wsClient.on('team:cursor:move', onCursorMove));
    }

    if (onSelectionChange) {
      unsubscribers.push(wsClient.on('team:selection:change', onSelectionChange));
    }

    // Latency monitoring
    unsubscribers.push(
      wsClient.on('heartbeat:ack', (data) => {
        const latency = Date.now() - lastPingTime.current;
        setState(prev => ({ ...prev, latency }));
      })
    );

    cleanup(...args: unknown[]) => unknowns.current = unsubscribers;
  }, [userId, showId, onUpdate, onUserJoin, onUserLeave, onFormationAdd,
      onFormationRemove, onFormationMove, onPlaybackSync, onCursorMove, onSelectionChange]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    cleanup(...args: unknown[]) => unknowns.current.forEach(cleanup => cleanup());
    cleanup(...args: unknown[]) => unknowns.current = [];

    if (showId) {
      wsClient.leaveShow();
    }

    wsClient.disconnect();
    setState(prev => ({ ...prev, connected: false, activeUsers: [] }));
  }, [showId]);

  // Join a different show
  const joinShow = useCallback((newShowId: string) => {
    if (!state.connected) return;

    if (showId) {
      wsClient.leaveShow();
    }

    wsClient.joinShow(newShowId);
  }, [state.connected, showId]);

  // Send updates
  const sendUpdate = useCallback($1: unknown) => {
    if (!state.connected) return;
    wsClient.updateShow(changes);
  }, [state.connected]);

  const addFormation = useCallback((formation: any, position: number) => {
    if (!state.connected) return;
    wsClient.addFormation(formation, position);
  }, [state.connected]);

  const removeFormation = useCallback((formationId: string) => {
    if (!state.connected) return;
    wsClient.removeFormation(formationId);
  }, [state.connected]);

  const moveFormation = useCallback((
    formationId: string,
    oldPosition: number,
    newPosition: number
  ) => {
    if (!state.connected) return;
    wsClient.moveFormation(formationId, oldPosition, newPosition);
  }, [state.connected]);

  const syncPlayback = useCallback((currentTime: number, isPlaying: boolean) => {
    if (!state.connected) return;
    wsClient.syncPlayback(currentTime, isPlaying);
  }, [state.connected]);

  const updateCursor = useCallback((x: number, y: number, element?: string) => {
    if (!state.connected) return;
    wsClient.updateCursor(x, y, element);
  }, [state.connected]);

  const updateSelection = useCallback((selectedIds: string[]) => {
    if (!state.connected) return;
    wsClient.updateSelection(selectedIds);
  }, [state.connected]);

  const startLivePreview = useCallback(() => {
    if (!state.connected || !showId) return;
    wsClient.startLivePreview(showId);
  }, [state.connected, showId]);

  const stopLivePreview = useCallback(() => {
    if (!state.connected || !showId) return;
    wsClient.stopLivePreview(showId);
  }, [state.connected, showId]);

  // Set up connection and cleanup
  useEffect(() => {
    if (userId) {
      connect();
    }

    // Set up ping interval for latency monitoring
    pingInterval.current = setInterval(() => {
      if (state.connected) {
        lastPingTime.current = Date.now();
        // wsClient will handle the heartbeat internally
      }
    }, 30000);

    return () => {
      disconnect();
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
    };
  }, [userId]);

  // Handle show changes
  useEffect(() => {
    if (state.connected && showId) {
      joinShow(showId);
    }
  }, [state.connected, showId, joinShow]);

  return {
    // State
    ...state,

    // Connection methods
    connect,
    disconnect,
    joinShow,

    // Data methods
    sendUpdate,
    addFormation,
    removeFormation,
    moveFormation,
    syncPlayback,
    updateCursor,
    updateSelection,

    // Preview methods
    startLivePreview,
    stopLivePreview,
  };
}
