import "dotenv/config";
import { getTestEnvironment } from "./getTestEnvironment";
import * as v from "valibot";

export const getBaseUrl = () => {
  const baseUrlRes = v.safeParse(
    v.pipe(v.string(), v.url()),
    process.env.BASE_URL
  );

  if (baseUrlRes.success) {
    return baseUrlRes.output;
  }

  const testEnv = getTestEnvironment();

  if (testEnv === "local") {
    return "http://localhost:6001/";
  }

  if (testEnv === "production") {
    return "https://home.account.gov.uk";
  }

  return `https://home.${testEnv}.account.gov.uk`;
};
