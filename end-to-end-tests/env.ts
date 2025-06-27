import "dotenv/config";
import * as v from "valibot";

const envSchema = v.object({
  HUMAN_IN_THE_LOOP: v.pipe(
    v.fallback(v.pipe(v.string(), v.value("1")), "0"),
    v.transform((val) => Boolean(Number(val)))
  ),
  TEST_TARGET: v.union([v.literal("local"), v.literal("build")]),
  TEST_REPORT_DIR: v.string(),
});

export const env = v.parse(envSchema, {
  ...process.env,
  TEST_REPORT_DIR:
    process.env.TEST_REPORT_ABSOLUTE_DIR ?? process.env.TEST_REPORT_DIR,
});
