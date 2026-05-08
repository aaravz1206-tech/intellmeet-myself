import { Server } from 'socket.io';

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // In production, restrict this to your frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a specific meeting room
    socket.on('join-meeting', (meetingId) => {
      socket.join(meetingId);
      console.log(`User ${socket.id} joined meeting: ${meetingId}`);
      
      // Notify others in the room
      socket.to(meetingId).emit('user-connected', socket.id);
    });

    // WebRTC Signaling: Pass offer/answer/ice-candidates between peers
    socket.on('signal', (data) => {
      // Send signal data to a specific user in the meeting room
      io.to(data.to).emit('signal', {
        from: socket.id,
        signal: data.signal,
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io;
};
import redisClient from '../config/redis.js';

// ... inside the io.on('connection') block

socket.on('join-room', async ({ meetingId, userId }) => {
    socket.join(meetingId);

    // Store participant in Redis for fast lookup
    // Format: meeting:meetingId -> Set of userIds
    await redisClient.sadd(`meeting:${meetingId}`, userId);

    // Get updated count
    const count = await redisClient.scard(`meeting:${meetingId}`);
    
    // Broadcast to the room
    io.to(meetingId).emit('room-info', {
        activeParticipants: count,
        newParticipant: userId
    });
});

socket.on('leave-room', async ({ meetingId, userId }) => {
    await redisClient.srem(`meeting:${meetingId}`, userId);
    socket.leave(meetingId);
});