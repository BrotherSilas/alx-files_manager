import { createClient } from 'redis';

class RedisClient {
    constructor() {
        this.client = createClient();
        this.client.on('error', (err) => console.error('Redis Client Error:', err));
        this.client.connect(); // Explicitly connect to Redis
    }

    isAlive() {
        return this.client.isOpen; // Check if the client is open
    }

    async get(key) {
        try {
            return await this.client.get(key); // Get value
        } catch (err) {
            console.error('Error in GET operation:', err);
            return null;
        }
    }

    async set(key, value, duration) {
        try {
            await this.client.setEx(key, duration, value); // Set value with TTL
        } catch (err) {
            console.error('Error in SET operation:', err);
        }
    }

    async del(key) {
        try {
            await this.client.del(key); // Delete key
        } catch (err) {
            console.error('Error in DEL operation:', err);
        }
    }
}

const redisClient = new RedisClient();
export default redisClient;

