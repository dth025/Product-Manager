const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/productRoutes');
const stockRoutes = require('./routes/stockRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/products';
const REDIS_URL = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`;

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.get('/', (req, res) => {
  res.send('Welcome to Product Service API');
});

const redisClient = redis.createClient({ url: REDIS_URL });

const connectMongo = mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB error:', err);
    process.exit(1);
  });

const connectRedis = redisClient.connect()
  .then(() => {
    console.log('Redis connected');
    app.set('redisClient', redisClient);
  })
  .catch(err => {
    console.error('Redis error:', err);
    process.exit(1);
  });

Promise.all([connectMongo, connectRedis])
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Startup failed:', err);
    process.exit(1);
  });
