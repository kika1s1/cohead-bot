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
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  isExcused: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

export const HeadsUpSubmissionModel = mongoose.model('HeadsUpSubmission', HeadsUpSubmissionSchema);