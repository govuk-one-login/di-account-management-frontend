import { GlobalLogoutServiceInterface } from "./types";
import { RedisStore } from "connect-redis";

export function globalLogoutService(

): GlobalLogoutServiceInterface {
  const clearSessionForSubject = async function (
    subjectId: string
  ): Promise<void> {

  };

  return {
    clearSessionForSubject,
  };
}