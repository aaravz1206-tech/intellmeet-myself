import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    meetingCode: {
      type: String,
      required: true,
      unique: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    // --- ADDED THESE INSIDE THE BRACKETS ---
    recordings: [
      {
        publicId: String,  // Cloudinary/S3 ID
        url: String,       // Access URL
        duration: Number,  // Duration in seconds
        createdAt: { type: Date, default: Date.now }
      }
    ],
    isRecording: { 
      type: Boolean, 
      default: false 
    },
    // ---------------------------------------
  },
  { timestamps: true }
);

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;