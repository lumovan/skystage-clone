/**
 * WebSocket Server for Real-time Collaboration
 * Handles live show updates, team collaboration, and notifications
 */

const { createServer } = require('http');
const { Server } = require('socket.io');
const { parse } = require('url');

const PORT = process.env.WS_PORT || 3001;

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Store active connections and show rooms
const activeShows = new Map();
const userSessions = new Map();

// Middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  // TODO: Verify JWT token
  if (!token) {
    // Allow anonymous connections for now
    socket.userId = `anon_${socket.id}`;
  } else {
    // Decode token to get user ID
    socket.userId = token; // Simplified for demo
  }

  next();
});

// Handle connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId} (${socket.id})`);

  // Store user session
  userSessions.set(socket.userId, {
    socketId: socket.id,
    connectedAt: Date.now(),
    currentShow: null,
  });

  // Broadcast user online status
  socket.broadcast.emit('team:member:online', socket.userId);

  // Handle joining a show
  socket.on('show:join', (showId) => {
    console.log(`User ${socket.userId} joining show ${showId}`);

    // Leave previous show if any
    if (socket.currentShow) {
      socket.leave(socket.currentShow);
      const showUsers = activeShows.get(socket.currentShow);
      if (showUsers) {
        showUsers.delete(socket.userId);
      }
    }

    // Join new show
    socket.join(showId);
    socket.currentShow = showId;

    // Track active users in show
    if (!activeShows.has(showId)) {
      activeShows.set(showId, new Set());
    }
    activeShows.get(showId).add(socket.userId);

    // Update user session
    const session = userSessions.get(socket.userId);
    if (session) {
      session.currentShow = showId;
    }

    // Notify others in the show
    socket.to(showId).emit('show:user:joined', {
      userId: socket.userId,
      timestamp: Date.now(),
    });

    // Send current show state to new user
    // TODO: Fetch from database
    socket.emit('show:state', {
      showId,
      users: Array.from(activeShows.get(showId) || []),
    });
  });

  // Handle leaving a show
  socket.on('show:leave', (showId) => {
    console.log(`User ${socket.userId} leaving show ${showId}`);

    socket.leave(showId);
    socket.currentShow = null;

    // Remove from active users
    const showUsers = activeShows.get(showId);
    if (showUsers) {
      showUsers.delete(socket.userId);
      if (showUsers.size === 0) {
        activeShows.delete(showId);
      }
    }

    // Update user session
    const session = userSessions.get(socket.userId);
    if (session) {
      session.currentShow = null;
    }

    // Notify others in the show
    socket.to(showId).emit('show:user:left', {
      userId: socket.userId,
      timestamp: Date.now(),
    });
  });

  // Handle show updates
  socket.on('show:update', (data) => {
    if (!socket.currentShow) return;

    // Broadcast to all users in the show except sender
    socket.to(socket.currentShow).emit('show:update', {
      ...data,
      userId: socket.userId,
      timestamp: Date.now(),
    });

    // TODO: Save to database
  });

  // Handle formation operations
  socket.on('show:formation:add', (data) => {
    if (!socket.currentShow) return;

    socket.to(socket.currentShow).emit('show:formation:add', {
      ...data,
      userId: socket.userId,
      timestamp: Date.now(),
    });
  });

  socket.on('show:formation:remove', (formationId) => {
    if (!socket.currentShow) return;

    socket.to(socket.currentShow).emit('show:formation:remove', formationId);
  });

  socket.on('show:formation:move', (data) => {
    if (!socket.currentShow) return;

    socket.to(socket.currentShow).emit('show:formation:move', {
      ...data,
      userId: socket.userId,
      timestamp: Date.now(),
    });
  });

  // Handle playback sync
  socket.on('show:playback:sync', (data) => {
    if (!socket.currentShow) return;

    socket.to(socket.currentShow).emit('show:playback:sync', {
      ...data,
      userId: socket.userId,
      timestamp: Date.now(),
    });
  });

  // Handle cursor movements (for collaboration)
  socket.on('team:cursor:move', (data) => {
    if (!socket.currentShow) return;

    socket.to(socket.currentShow).emit('team:cursor:move', {
      ...data,
      userId: socket.userId,
    });
  });

  // Handle selection changes
  socket.on('team:selection:change', (data) => {
    if (!socket.currentShow) return;

    socket.to(socket.currentShow).emit('team:selection:change', {
      ...data,
      userId: socket.userId,
    });
  });

  // Handle live preview
  socket.on('preview:start', (showId) => {
    console.log(`Starting live preview for show ${showId}`);

    // Start sending preview frames
    const interval = setInterval(() => {
      // TODO: Generate actual preview data
      const previewData = {
        showId,
        timestamp: Date.now(),
        dronePositions: generateDronePositions(),
        effects: [],
      };

      io.to(showId).emit('preview:frame', previewData);
    }, 100); // 10 FPS

    socket.previewInterval = interval;
  });

  socket.on('preview:stop', (showId) => {
    console.log(`Stopping live preview for show ${showId}`);

    if (socket.previewInterval) {
      clearInterval(socket.previewInterval);
      socket.previewInterval = null;
    }
  });

  // Handle heartbeat
  socket.on('heartbeat', (data) => {
    socket.emit('heartbeat:ack', { timestamp: Date.now() });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.userId} (${reason})`);

    // Clean up user session
    userSessions.delete(socket.userId);

    // Remove from active shows
    if (socket.currentShow) {
      const showUsers = activeShows.get(socket.currentShow);
      if (showUsers) {
        showUsers.delete(socket.userId);
        if (showUsers.size === 0) {
          activeShows.delete(socket.currentShow);
        }
      }

      // Notify others in the show
      socket.to(socket.currentShow).emit('show:user:left', {
        userId: socket.userId,
        timestamp: Date.now(),
      });
    }

    // Clear any intervals
    if (socket.previewInterval) {
      clearInterval(socket.previewInterval);
    }

    // Broadcast user offline status
    socket.broadcast.emit('team:member:offline', socket.userId);
  });
});

// Helper function to generate drone positions
function generateDronePositions() {
  const positions = [];
  const count = 100;
  const time = Date.now() / 1000;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 10 + Math.sin(time + i * 0.1) * 5;

    positions.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(time * 2 + i * 0.2) * 5,
      z: Math.sin(angle) * radius,
    });
  }

  return positions;
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Accepting connections from: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing WebSocket server');

  // Close all connections
  io.disconnectSockets(true);

  // Close server
  httpServer.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

module.exports = { io };
