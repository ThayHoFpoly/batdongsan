const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const setupSession = () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/batdongsan_project';

  return session({
    name: 'sessionId',
    secret: process.env.SESSION_SECRET || 'dbs_real_estate_secret_key_default',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoUri,
      collectionName: 'admin_sessions',
      ttl: 24 * 60 * 60, // 1 day
      autoRemove: 'native',
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  });
};

module.exports = setupSession;
