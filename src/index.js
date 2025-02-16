import mongoose from 'mongoose';
import { MONGODB_URI } from './config/env.js';
import './presentation/routes/botRoutes.js';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));