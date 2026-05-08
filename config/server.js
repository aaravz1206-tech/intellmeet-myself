import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';

dotenv.config();

const app = express();

// Security & Parsers
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Database
connectDB();

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'IntellMeet Backend is up and running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'IntellMeet Backend is up and running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// ... existing imports
import meetingRoutes from './routes/meetingRoutes.js';

// ... under auth routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
import http from 'http';
import { initSocket } from './services/socketService.js';

// ... (previous imports and app configuration)

const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);

// Attach io instance to app for use in controllers if needed
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// ... all your app.use('/api/...') lines ...

// These MUST be at the bottom
app.use(notFound);
app.use(errorHandler);