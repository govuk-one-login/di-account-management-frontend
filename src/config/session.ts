import redis, { ClientOpts, RedisClient } from "redis";
import connect_redis, { RedisStore } from "connect-redis";
import session from "express-session";
import { getRedisHost, getRedisPort } from "../config";
import { RedisConfig } from "../types";
const RedisStore = connect_redis(session);

export function getRedisClient(redisConfig: RedisConfig): RedisClient {
  let config: ClientOpts;

  if (redisConfig.isLocal) {
    config = {
      host: getRedisHost(),
      port: getRedisPort(),
    };
  } else {
    config = {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      tls: true,
    };
  }

  return redis.createClient(config);
}

export function getSessionStore(redisClient: RedisClient): RedisStore {
  return new RedisStore({
    client: redisClient,
  });
}

export function getSessionCookieOptions(
  isProdEnv: boolean,
  expiry: number,
  secret: string
): any {
  return {
    name: "ams",
    secret: secret,
    maxAge: expiry,
    secure: isProdEnv,
  };
}
