/**
 * WebSocket Client for Real-time Collaboration
 * Handles live show updates, team collaboration, and notifications
 */

import { io, Socket } from 'socket.io-client';

interface WebSocketEvents {
  // Show collaboration
  'show:join': (showId: string) => void;
  'show:leave': (showId: string) => void;
  'show:update': (data: ShowUpdate) => void;
  'show:formation:add': (data: FormationAdd) => void;
  'show:formation:remove': (formationId: string) => void;
  'show:formation:move': (data: FormationMove) => void;
  'show:playback:sync': (data: PlaybackSync) => void;

  // Team collaboration
  'team:member:online': (userId: string) => void;
  'team:member:offline': (userId: string) => void;
  'team:cursor:move': (data: CursorPosition) => void;
  'team:selection:change': (data: SelectionChange) => void;

  // Notifications
  'notification:show': (data: Notification) => void;
  'notification:formation': (data: Notification) => void;
  'notification:booking': (data: Notification) => void;

  // Live preview
  'preview:start': (showId: string) => void;
  'preview:stop': (showId: string) => void;
  'preview:frame': (data: PreviewFrame) => void;
}

interface ShowUpdate {
  showId: string;
  userId: string;
  changes: any;
  timestamp: number;
}

interface FormationAdd {
  showId: string;
  formation: any;
  position: number;
  userId: string;
}

interface FormationMove {
  showId: string;
  formationId: string;
  oldPosition: number;
  newPosition: number;
  userId: string;
}

interface PlaybackSync {
  showId: string;
  currentTime: number;
  isPlaying: boolean;
  userId: string;
}

interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  element?: string;
}

interface SelectionChange {
  userId: string;
  selectedIds: string[];
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  data?: any;
}

interface PreviewFrame {
  showId: string;
  timestamp: number;
  dronePositions: Array<{ x: number; y: number; z: number }>;
  effects: unknown[];
}

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => unknown>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentShowId: string | null = null;
  private userId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      auth: {
        token: this.getAuthToken(),
      },
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private getAuthToken(): string | null {
    // Get auth token from localStorage or session
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected', null);

      // Rejoin show if previously connected
      if (this.currentShowId) {
        this.joinShow(this.currentShowId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('disconnected', reason);

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Show collaboration events
    this.socket.on('show:update', (data: ShowUpdate) => {
      this.emit('show:update', data);
    });

    this.socket.on('show:formation:add', (data: FormationAdd) => {
      this.emit('show:formation:add', data);
    });

    this.socket.on('show:formation:remove', (formationId: string) => {
      this.emit('show:formation:remove', formationId);
    });

    this.socket.on('show:formation:move', (data: FormationMove) => {
      this.emit('show:formation:move', data);
    });

    this.socket.on('show:playback:sync', (data: PlaybackSync) => {
      this.emit('show:playback:sync', data);
    });

    // Team collaboration events
    this.socket.on('team:member:online', (userId: string) => {
      this.emit('team:member:online', userId);
    });

    this.socket.on('team:member:offline', (userId: string) => {
      this.emit('team:member:offline', userId);
    });

    this.socket.on('team:cursor:move', (data: CursorPosition) => {
      this.emit('team:cursor:move', data);
    });

    this.socket.on('team:selection:change', (data: SelectionChange) => {
      this.emit('team:selection:change', data);
    });

    // Notification events
    this.socket.on('notification', (data: Notification) => {
      this.emit(`notification:${data.type}`, data);
    });

    // Live preview events
    this.socket.on('preview:frame', (data: PreviewFrame) => {
      this.emit('preview:frame', data);
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect:failed', null);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.initialize();
    }, delay);
  }

  // Public methods

  public connect(userId: string) {
    this.userId = userId;
    if (!this.socket?.connected) {
      this.initialize();
    }
  }

  public disconnect() {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
  }

  public joinShow(showId: string) {
    this.currentShowId = showId;
    this.socket?.emit('show:join', showId);
  }

  public leaveShow() {
    if (this.currentShowId) {
      this.socket?.emit('show:leave', this.currentShowId);
      this.currentShowId = null;
    }
  }

  public updateShow($1: unknown) {
    if (!this.currentShowId) return;

    this.socket?.emit('show:update', {
      showId: this.currentShowId,
      userId: this.userId!,
      changes,
      timestamp: Date.now(),
    });
  }

  public addFormation(formation: any, position: number) {
    if (!this.currentShowId) return;

    this.socket?.emit('show:formation:add', {
      showId: this.currentShowId,
      formation,
      position,
      userId: this.userId!,
    });
  }

  public removeFormation(formationId: string) {
    if (!this.currentShowId) return;

    this.socket?.emit('show:formation:remove', formationId);
  }

  public moveFormation(formationId: string, oldPosition: number, newPosition: number) {
    if (!this.currentShowId) return;

    this.socket?.emit('show:formation:move', {
      showId: this.currentShowId,
      formationId,
      oldPosition,
      newPosition,
      userId: this.userId!,
    });
  }

  public syncPlayback(currentTime: number, isPlaying: boolean) {
    if (!this.currentShowId) return;

    this.socket?.emit('show:playback:sync', {
      showId: this.currentShowId,
      currentTime,
      isPlaying,
      userId: this.userId!,
    });
  }

  public updateCursor(x: number, y: number, element?: string) {
    this.socket?.emit('team:cursor:move', {
      userId: this.userId!,
      x,
      y,
      element,
    });
  }

  public updateSelection(selectedIds: string[]) {
    this.socket?.emit('team:selection:change', {
      userId: this.userId!,
      selectedIds,
    });
  }

  public startLivePreview(showId: string) {
    this.socket?.emit('preview:start', showId);
  }

  public stopLivePreview(showId: string) {
    this.socket?.emit('preview:stop', showId);
  }

  // Event listener management

  public on(event: string, callback: (...args: unknown[]) => unknown) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => this.off(event, callback);
  }

  public off(event: string, callback: (...args: unknown[]) => unknown) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit($1: unknown) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Singleton instance
  private static instance: WebSocketClient;

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }
}

export default WebSocketClient;
export const wsClient = WebSocketClient.getInstance();
