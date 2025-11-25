import { env } from "node:process";

export const STREAM = env.STREAM || "orders:stream";
export const GROUP = env.GROUP || "payment-workers";
export const REDIS_URL = env.REDIS_URL || "redis://localhost:6379";
export const MAX_STREAM_LENGTH = env.MAX_STREAM_LENGTH || 10_000;
export const RECLAIM_IDLE_MS = env.RECLAIM_IDLE_MS || 120_000;
