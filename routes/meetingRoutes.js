import express from 'express';
import { 
  createMeeting, 
  getMeetingByCode, 
  getMyMeetings // 1. Add import
} from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createMeeting);
router.get('/history', protect, getMyMeetings); // 2. Add this specific line
router.get('/:code', protect, getMeetingByCode);

export default router;