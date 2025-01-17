import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'http://localhost:6379/');

export default redis;