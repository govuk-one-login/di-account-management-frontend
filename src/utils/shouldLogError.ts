import { ERROR_MESSAGES } from "../app.constants";

export function shouldLogError(error: any) {
  return (
    !(error instanceof Error) ||
    ![ERROR_MESSAGES.FAILED_TO_REFRESH_TOKEN].includes(error.message)
  );
}
