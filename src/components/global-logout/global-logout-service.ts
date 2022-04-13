import { GlobalLogoutServiceInterface } from "./types";

export function globalLogoutService(): GlobalLogoutServiceInterface {
  const clearSessionForSubject = async function (
    subjectId: string
  ): Promise<void> {
    `Logout request received for ${subjectId}`;
  };

  return {
    clearSessionForSubject,
  };
}
