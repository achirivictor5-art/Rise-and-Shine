const mongoose = require('mongoose');

let cached = global.__riseMongoose;
if (!cached) cached = global.__riseMongoose = { conn: null, promise: null };

async function connectDb() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    cached.promise = mongoose.connect(uri).then((m) => m.connection);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDb;
