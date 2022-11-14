import { RedisClient } from "redis";
import { SubjectSessionIndexService } from "./types";
import { getSessionExpiry } from "../config";

export function subjectSessionIndex(
  redisClient: RedisClient
): SubjectSessionIndexService {
  const addSession = (subjectId: string, sessionId: string): void => {
    const now = new Date().getTime();
    purgeOld(subjectId, now);
    redisClient.ZADD(subjectIdKey(subjectId), now, sessionId);
  };

  const getSessions = (subjectId: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const now = new Date().getTime();
      purgeOld(subjectId, now);
      redisClient.ZRANGE(subjectIdKey(subjectId), 0, now, (err, reply) => {
        if (err) {
          reject(err);
        }
        return resolve(reply);
      });
    });
  };

  const removeSession = (subjectId: string, sessionId: string): void => {
    const now = new Date().getTime();
    purgeOld(subjectId, now);
    redisClient.ZREM(subjectIdKey(subjectId), sessionId);
  };

  const purgeOld = (subjectId: string, now: number) => {
    redisClient.ZREMRANGEBYSCORE(
      subjectIdKey(subjectId),
      0,
      now - getSessionExpiry()
    );
  };

  const subjectIdKey = (subjectId: string): string => {
    return `subject:${subjectId}`;
  };

  return {
    addSession,
    getSessions,
    removeSession,
  };
}
