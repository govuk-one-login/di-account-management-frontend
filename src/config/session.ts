import redis, { ClientOpts } from "redis";
import connect_redis, { RedisStore } from "connect-redis";
import session, { CookieOptions } from "express-session";
import CF_CONFIG from "./cf";
import { getLocalRedsHost } from "../config";
const RedisStore = connect_redis(session);

export interface RedisConfigCf {
  host: string;
  name: string;
  port: string;
  password: string;
  uri: string;
}

export function getSessionStore(): RedisStore {
  let config: ClientOpts;
  // if (CF_CONFIG.isLocal) {
    config = {
      host: getLocalRedsHost(),
    };
  // } else {
  //   const redisConfig = CF_CONFIG.getServiceCreds(
  //     /-redis$/gims
  //   ) as RedisConfigCf;
  //   config = {
  //     host: redisConfig.host,
  //     port: parseInt(redisConfig.port),
  //     password: redisConfig.password,
  //     tls: true,
  //   };
  // }

  return new RedisStore({
    client: redis.createClient(config),
  });
}

export function getSessionCookieOptions(
  isProdEnv: boolean,
  expiry: number
): CookieOptions {
  return {
    maxAge: expiry,
    secure: isProdEnv,
    httpOnly: true,
    signed: isProdEnv,
    sameSite: isProdEnv,
  };
}
