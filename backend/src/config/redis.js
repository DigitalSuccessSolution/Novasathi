const Redis = require('ioredis');

let redis;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Allow infinite retries in background without crashing
    retryStrategy: (times) => {
      if (times > 3) return null; // Stop trying after 3 times and trigger error
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });
} catch (err) {
  console.warn('⚠️  Redis not available, using in-memory fallback');
  // In-memory fallback for development without Redis
  const store = new Map();
  redis = {
    get: async (key) => store.get(key) || null,
    set: async (key, value, ...args) => { 
      const isNX = args.includes('NX');
      if (isNX && store.has(key)) return null;
      
      store.set(key, value);
      
      const exIndex = args.indexOf('EX');
      if (exIndex !== -1 && args[exIndex + 1]) {
        const ttl = parseInt(args[exIndex + 1]);
        setTimeout(() => store.delete(key), ttl * 1000);
      }
      return 'OK'; 
    },
    del: async (key) => { store.delete(key); return 1; },
    keys: async (pattern) => [...store.keys()].filter(k => k.includes(pattern.replace('*', ''))),
    setex: async (key, ttl, value) => { store.set(key, value); setTimeout(() => store.delete(key), ttl * 1000); return 'OK'; },
    incr: async (key) => { const v = (parseInt(store.get(key)) || 0) + 1; store.set(key, v.toString()); return v; },
    expire: async () => 1,
    sadd: async (key, ...members) => { const s = store.get(key) || new Set(); members.forEach(m => s.add(m)); store.set(key, s); return members.length; },
    srem: async (key, ...members) => { const s = store.get(key); if (s) members.forEach(m => s.delete(m)); return members.length; },
    smembers: async (key) => { const s = store.get(key); return s ? [...s] : []; },
    srandmember: async (key) => { const s = store.get(key); if (!s || s.size === 0) return null; const arr = [...s]; return arr[Math.floor(Math.random() * arr.length)]; },
  };
}

module.exports = redis;
