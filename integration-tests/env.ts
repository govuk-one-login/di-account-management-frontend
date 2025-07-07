import "dotenv/config";
import * as v from "valibot";

const boolish = v.pipe(
  v.unknown(),
  v.transform((val) => {
    const truthyValues: unknown[] = [1, "1", true, "true"];
    return truthyValues.includes(val);
  })
);

const envSchema = v.object({
  HUMAN_IN_THE_LOOP: v.optional(boolish, false),
  TEST_TARGET: v.fallback(
    v.union([
      v.literal("local"),
      v.literal("dev"),
      v.literal("build"),
      v.literal("staging"),
      v.literal("integration"),
      v.literal("production"),
    ]),
    "local"
  ),
  PRE_OR_POST_DEPLOY: v.fallback(
    v.union([v.literal("pre"), v.literal("post")]),
    "post"
  ),
  TEST_REPORT_DIR: v.optional(v.string()),
  UPDATE_SNAPSHOTS: v.optional(boolish, false),
});

export const env = v.parse(envSchema, {
  ...process.env,
  // See https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3054010402/How+to+run+tests+against+your+deployed+application+in+a+SAM+deployment+pipeline#Getting-details-about-the-target-environments
  TEST_TARGET: process.env.TEST_ENVIRONMENT,
  TEST_REPORT_DIR:
    process.env.TEST_REPORT_ABSOLUTE_DIR ?? process.env.TEST_REPORT_DIR,
});
