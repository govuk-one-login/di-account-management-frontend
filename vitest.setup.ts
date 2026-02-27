import { beforeAll } from "vitest";

beforeAll(() => {
  process.env.APP_ENV = "local";
  process.env.BASE_URL = "localhost:6001";
  process.env.AWS_REGION = "eu-west-2";
  process.env.OIDC_CLIENT_ID = "test-client-id";
  process.env.SESSION_SECRET = "test-secret"; //pragma: allowlist secret
  process.env.SESSION_EXPIRY = "3600000";
});
