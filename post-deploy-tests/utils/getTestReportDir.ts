import "dotenv/config";
import * as v from "valibot";

export const getTestReportDir = () => {
  const schema = v.string();
  return v.parse(
    schema,
    process.env.TEST_REPORT_ABSOLUTE_DIR ?? process.env.TEST_REPORT_DIR
  );
};
