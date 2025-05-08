import "dotenv/config";
import * as v from "valibot";

export const getTestEnvironment = () => {
  const schema = v.union([
    v.literal("local"),
    v.literal("dev"),
    v.literal("build"),
    v.literal("staging"),
    v.literal("production"),
  ]);
  return v.parse(schema, process.env.TEST_ENVIRONMENT);
};
