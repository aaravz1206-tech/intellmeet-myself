import express from 'express';
import { 
  createMeeting, 
  getMeetingByCode, 
  getMyMeetings // Add this import
} from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createMeeting);
router.get('/history', protect, getMyMeetings); // Add this line here
router.get('/:code', protect, getMeetingByCode);

export default router;