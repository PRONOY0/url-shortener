import { Redis } from "ioredis";

const redis = new Redis();

export const fixedWindow = async (req, res, next) => {
  // ? LIMIT is 5req/min

  const key = `req:${req.ip}`;
  const limit = 5; //* 5req
  const window = 60; //* 60sec - 1min

  const count = await redis.incr(key);

  if (count == 1) {
    await redis.expire(key, window);
  }

  if (count > limit) {
    return res.status(429).json({
      success: false,
      message: "Too many request",
    });
  }

  next();
};

export const slidingWindow = async (req, res, next) => {
    const key = `SW:${req.ip}`;
    const limit = 5;
    const window = 60;
    const now = Date.now();

    await redis.zremrangebyscore(key, 0, now - window * 1000);
    const count = await redis.zcard(key);
}