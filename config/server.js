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