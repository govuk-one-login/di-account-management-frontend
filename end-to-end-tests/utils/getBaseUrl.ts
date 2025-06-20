import { env } from "../env";

export const getBaseUrl = () => {
  if (env.TEST_ENVIRONMENT === "local") {
    return "http://localhost:6001/";
  }

  if (env.TEST_ENVIRONMENT === "production") {
    return "https://home.account.gov.uk";
  }

  return `https://home.${env.TEST_ENVIRONMENT}.account.gov.uk`;
};
