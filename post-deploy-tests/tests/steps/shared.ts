import { createBdd } from "playwright-bdd";
import { env } from "../../env";

const { Given } = createBdd();

Given("I am not testing against a local deployment", async ({ $test }) => {
  $test.skip(env.TEST_ENVIRONMENT === "local");
});
