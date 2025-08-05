# Integration tests

The integration tests are written with [Playwright](https://playwright.dev/) and [Playwright BDD](https://vitalets.github.io/playwright-bdd).

The `integration-tests` directory should be treated as a separate project. It should not import things from outside and the main project should not import things from within the `integration-tests` directory.

By default all tests are run against a desktop viewport and a mobile viewport.

## Authoring tests

When authoring tests try to stick to the Playwright best practices (https://playwright.dev/docs/best-practices).

Tests should be written in a BDD (business driven development) style from the context of a user. Try to avoid including technical details in steps.

Steps in files not prefixed with `@` are available to features up to the parent directory prefixed with `@`. If there is no parent directory prefixed with `@` then the steps will be available to all features. Try to scope steps as narrowly as possible.

## Running the tests locally

Tests are run on your local machine but control browsers running in a Docker container by utilising Playwright's server mode. Running the browsers in a container ensures consistent test results across different machines and architectures.

If using Docker Desktop on Mac or Windows you will need to `Enable host networking` in `Settings > Resources > Network`.

Being connected to the VPN may make some webchat related tests fail.

When running tests locally they are run against `http://localhost:6001` by default. Change the value of the environment variable `TEST_TARGET` to one of `dev | build | staging | integration | production` to run tests against the corresponding deployment instead.

### Steps to run the tests:

Copy the file `.env.integration-tests.sample` to `.env.integration-tests`.

Copy the file `integration-tests/.env.sample` to `integration-tests/.env`.

To run the tests:

```bash
cd integration-tests
npm run test
```

To run the tests in UI mode (when writing or changing tests UI mode is the best way to run and debug them):

```bash
cd integration-tests
npm run test:ui
```

To run the tests and update snapshots (snapshots are only updated if all tests pass):

```bash
cd integration-tests
npm run test:update-snapshots
```

Before running the tests these commands will start the app and also start the test server in which the browsers will run. These servers are also stopped once the tests have run. Starting the servers can take some time. If you're writing or updating tests and will need to frequently run them whilst doing so then prefer starting the app and test server manually:

To run the app:

```bash
cd integration-tests
npm run run-app
```

To run the test server:

```bash
cd integration-tests
npm run start-test-server
```

With the servers already running the tests will execute more quickly as they don't need to wait for the servers to start.

If you're using the VS Code Playwright extension (prefer using UI mode where possible) then you can run watch mode to automatically update the tests as changes are made:

```
cd integration-tests
npm run test:ui:watch
```

## Pre-deploy

By default the integration tests are run in GitHub Actions (see `.github/workflows/integration-tests.yml`). This allows us to have confidence that the app is working as expected before we merge and deploy changes.

When running in GitHub Actions the tests are run against a local version of the app much like when running the tests locally. The environment variables for this local version of the app are configured in `.github/workflows/integration-tests.yml`.

To skip a test in the pre-deployment environment tag the test with `@skipPreDeploy`.

## Post-deploy

Integration tests can also run in the deployment pipeline once the app has been deployed. By default tests will not run in the post-deployment environment. To run a test in the post-deployment tag it with `@postDeploy`. Currently they run against the `build` deployment but can also be configured to run against other deployments e.g. `staging`.

Prefer running tests in GitHub Actions against the local version of app and only run tests which target actual deployments when it is not possible to test the functionality earlier.

## Test tagging

Tests can be tagged using the following custom tags to alter their behaviour:

- `@postDeploy` - will run in post-deployment environment
- `@skipPreDeploy` - will not run in pre-deployment environment
- `@skipMobile` - will not against the mobile viewport
- `@skipDesktop` - will not against the desktop viewport
- `@skip-{target} e.g. @skip-local, @skip-build, @skip-staging` - will not run when the test target matches `{target}`
- `@failMobile` - is expected to fail when run against the mobile viewport
- `@failDesktop` - is expected to fail when run against the desktop viewport
- `@fail-{target} e.g. @skip-local, @skip-build, @skip-staging` - is expected to fail when the test target matches `{target}`
- `@noJs` - will run against a browser witb JavaScript disabled

There are also tags made available by Playwright BDD. See https://vitalets.github.io/playwright-bdd/#/writing-features/special-tags.
