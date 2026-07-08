import mongoose from 'mongoose';

const TEST_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/dashboard-app-test';

export const connectTestDB = async () => {
  await mongoose.connect(TEST_URI);
};

export const clearTestDB = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};

export const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};
