import { env } from "../env";

export const getBaseUrl = () => {
  if (env.TEST_TARGET === "local") {
    return "http://localhost:6001/";
  }

  if (env.TEST_TARGET === "production") {
    return "https://home.account.gov.uk";
  }

  return `https://home.${env.TEST_TARGET}.account.gov.uk`;
};
