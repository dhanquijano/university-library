import { Redis } from "@upstash/redis";
import config from "@/lib/config";

let redis: Redis | null = null;

try {
  if (config.env.upstash.redisUrl && config.env.upstash.redisToken) {
    redis = new Redis({
      url: config.env.upstash.redisUrl,
      token: config.env.upstash.redisToken,
    });
  } else {
    console.warn("Redis configuration missing. Some features may not work properly.");
  }
} catch (error) {
  console.error("Failed to initialize Redis:", error);
}

export default redis;
