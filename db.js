import mongoose from 'mongoose';

let connectionPromise = null;

export function connectDB(uri) {
  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = uri || process.env.MONGODB_URI;

  if (!mongoUri) {
    return Promise.reject(new Error('MONGODB_URI environment variable is not set'));
  }

  connectionPromise = mongoose.connect(mongoUri)
    .then(function(connection) {
      console.log('MongoDB connected');
      return connection;
    })
    .catch(function(error) {
      connectionPromise = null;
      throw error;
    });

  mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error:', err);
  });

  return connectionPromise;
}

