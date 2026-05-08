import { Redis } from "ioredis";

const client = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: true,
  },
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 100, 2000);
  },
});

client.on("ready", () => console.log("🟢 Ready"));
client.on("reconnecting", () => console.log("🔄 Reconnecting"));
client.on("end", () => console.log("🔴 Connection closed"));

export default client;

// national-whale-106977.upstash.io:6379


// intimate-cougar-111661.upstash.io:6379