import { env } from "../env";

export const getBaseUrl = () => {
  if (env.TEST_TARGET === "local") {
    return "http://localhost:6001/";
  }

  return `https://home.${env.TEST_TARGET}.account.gov.uk`;
};
