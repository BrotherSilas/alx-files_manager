import redisClient from './redis.js';

(async () => {
    console.log('Is Redis alive:', redisClient.isAlive()); // Check if Redis connection is alive

    console.log('Getting "myKey" before setting:');
    console.log(await redisClient.get('myKey')); // Should print null if "myKey" doesn't exist

    console.log('Setting "myKey" with value "12" for 5 seconds:');
    await redisClient.set('myKey', '12', 5); // Set "myKey" with value "12" and TTL 5 seconds

    console.log('Getting "myKey" after setting:');
    console.log(await redisClient.get('myKey')); // Should print "12"

    console.log('Waiting 10 seconds...');
    setTimeout(async () => {
        console.log('Getting "myKey" after 10 seconds:');
        console.log(await redisClient.get('myKey')); // Should print null (expired)
    }, 10000); // Delay 10 seconds
})();

