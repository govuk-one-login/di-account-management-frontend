import type { Config } from "jest";

const config: Config = {
  testMatch: ["**/**/*.step.ts"],
  verbose: true,
  forceExit: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
export default config;
