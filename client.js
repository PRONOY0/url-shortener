import { Redis } from "ioredis";

const client = new Redis(process.env.REDIS_URL, {
  tls: {},
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

client.on("error", (err) => {
  console.error("Redis error:", err.message);
});

client.on("connect", () => {
  console.log("✅ Redis connected");
});

export default client;
