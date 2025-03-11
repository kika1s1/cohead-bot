import mongoose from 'mongoose';

const HeadsUpSubmissionSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  group: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  telegram_id: {               
    type: String,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  isExcused: {
    type: Boolean,
    default: true,
  },
  checkout:{
    type: Boolean,
    default:false
  }
}, {
  timestamps: true
});

export const HeadsUpSubmissionModel = mongoose.model('HeadsUpSubmission', HeadsUpSubmissionSchema);