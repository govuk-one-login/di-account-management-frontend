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

  const getSessions = (subjectId: string): string[] => {
    const now = new Date().getTime();
    purgeOld(subjectId, now);
    let sessions: string[] = [];
    redisClient.ZRANGE(subjectIdKey(subjectId), 0, now, (err, reply) => {
      if (err) {
        throw err;
      }
      return (sessions = reply);
    });

    return sessions;
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
