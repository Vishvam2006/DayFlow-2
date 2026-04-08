import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

console.log('Testing connection to:', process.env.MONGODB_URL.replace(/:([^@]+)@/, ":****@"));

try {
  await mongoose.connect(process.env.MONGODB_URL, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log('SUCCESS: Connected to MongoDB');
  await mongoose.disconnect();
} catch (err) {
  console.error('FAILURE:', err.message);
  process.exit(1);
}
