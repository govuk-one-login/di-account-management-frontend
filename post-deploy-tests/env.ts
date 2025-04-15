import "dotenv/config";
import * as v from "valibot";

const envSchema = v.object({
  TEST_REPORT_DIR: v.string(),
  TEST_ENVIRONMENT: v.union([
    v.literal("local"),
    v.literal("dev"),
    v.literal("build"),
    v.literal("staging"),
    v.literal("production"),
  ]),
});

export const env = v.parse(envSchema, {
  ...process.env,
  TEST_REPORT_DIR:
    process.env.TEST_REPORT_ABSOLUTE_DIR ?? process.env.TEST_REPORT_DIR,
});
