import { env } from "../../env";
import { bdd } from "./fixtures";

const { Given } = bdd;

Given("I am not testing against a local deployment", async ({ $test }) => {
  $test.skip(env.TEST_ENVIRONMENT === "local");
});
