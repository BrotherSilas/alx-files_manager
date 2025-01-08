// tests/redisClient.test.js
import { expect } from 'chai';
import redisClient from '../utils/redis.js';

describe('RedisClient', () => {
    before(async () => {
        await redisClient.client.flushall('ASYNC');
    });

    after(async () => {
        await redisClient.client.flushall('ASYNC');
    });

    it('should connect to Redis successfully', () => {
        expect(redisClient.isAlive()).to.be.true;
    });

    it('should set and get a value successfully', async () => {
        await redisClient.set('test_key', 'test_value', 60);
        const value = await redisClient.get('test_key');
        expect(value).to.equal('test_value');
    });

    it('should delete a value successfully', async () => {
        await redisClient.set('test_key2', 'test_value2', 60);
        await redisClient.del('test_key2');
        const value = await redisClient.get('test_key2');
        expect(value).to.be.null;
    });
});
