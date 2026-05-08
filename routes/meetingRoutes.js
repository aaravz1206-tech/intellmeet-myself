import express from 'express';
import { createMeeting, getMeetingByCode } from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createMeeting);
router.get('/:code', protect, getMeetingByCode);

export default router;