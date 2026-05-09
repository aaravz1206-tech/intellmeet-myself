import { Server } from 'socket.io';
import redisClient from '../config/redis.js';

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
    socket.on('join-room', async ({ meetingId, userId }) => {
      socket.join(meetingId);
      console.log(`User ${userId} (Socket: ${socket.id}) joined meeting: ${meetingId}`);

      // Store participant in Redis for fast lookup
      if (redisClient) {
        try {
          await redisClient.sadd(`meeting:${meetingId}`, userId);
          const count = await redisClient.scard(`meeting:${meetingId}`);
          
          // Broadcast room info
          io.to(meetingId).emit('room-info', {
            activeParticipants: count,
            newParticipant: userId
          });
        } catch (error) {
          console.error('Redis error joining room:', error);
        }
      }

      // Notify others in the room for WebRTC mesh connection
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

    socket.on('leave-room', async ({ meetingId, userId }) => {
      if (redisClient) {
        try {
          await redisClient.srem(`meeting:${meetingId}`, userId);
        } catch (error) {
           console.error('Redis error leaving room:', error);
        }
      }
      socket.leave(meetingId);
      socket.to(meetingId).emit('user-disconnected', socket.id);
    });

    // Whiteboard events
    socket.on('draw', (data) => {
      // Broadcast the drawing data (coordinates, color, tool) to everyone else in the room
      socket.to(data.meetingId).emit('draw', data);
    });

    socket.on('clear-board', (meetingId) => {
      socket.to(meetingId).emit('clear-board');
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // In a more complex setup, you'd find which rooms this socket was in
      // and emit user-disconnected to those rooms.
    });
  });

  return io;
};