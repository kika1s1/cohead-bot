import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  group: { type: String, required: true },
});

export const StudentModel = mongoose.model('Student', studentSchema);