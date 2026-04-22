const Redis = require('ioredis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log(`Connecting to Redis at: ${redisUrl}`);

const redis = new Redis(redisUrl);

redis.on('connect', async () => {
    console.log('✅ Redis Connected successfully!');
    
    try {
        await redis.set('test_key', 'Hello NovaSathi!');
        const val = await redis.get('test_key');
        console.log(`Test GET: ${val}`);
        
        if (val === 'Hello NovaSathi!') {
            console.log('✨ Redis functionality verified!');
        } else {
            console.log('❌ Redis data mismatch.');
        }
    } catch (err) {
        console.error('❌ Redis Operation Error:', err);
    } finally {
        redis.disconnect();
        process.exit(0);
    }
});

redis.on('error', (err) => {
    console.error('❌ Redis Error:', err.message);
    process.exit(1);
});
