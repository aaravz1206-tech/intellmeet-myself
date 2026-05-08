import Meeting from '../models/Meeting.js';
import crypto from 'crypto';

// @desc    Create a new meeting
// @route   POST /api/meetings
export const createMeeting = async (req, res) => {
  try {
    const { title } = req.body;
    
    // Generate a unique 9-character meeting code (e.g., abc-def-ghi)
    const meetingCode = crypto.randomBytes(5).toString('hex');

    const meeting = await Meeting.create({
      title,
      host: req.user._id,
      meetingCode,
    });

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get meeting details by code
// @route   GET /api/meetings/:code
export const getMeetingByCode = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingCode: req.params.code })
      .populate('host', 'name email avatar');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};