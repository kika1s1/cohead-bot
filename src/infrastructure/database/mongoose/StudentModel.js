import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  school: {                      
    type: String,
    required: true,
  },
  group: {
    type: String,
    required: true,
  },
  telegram_id: {                
    type: String,
  },
  isRegistered: {               
    type: Boolean,
    default: false,
  },
}, {
  timestamps:true
});

export const StudentModel = mongoose.model("Student", studentSchema);
