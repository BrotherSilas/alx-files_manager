import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      retry_strategy: (options) => {
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    this.client.on('error', (error) => {
      console.error('Redis client error:', error);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const asyncGet = promisify(this.client.get).bind(this.client);
    return asyncGet(key);
  }

  async set(key, value, duration) {
    const asyncSet = promisify(this.client.setex).bind(this.client);
    return asyncSet(key, duration, value);
  }

  async del(key) {
    const asyncDel = promisify(this.client.del).bind(this.client);
    return asyncDel(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
