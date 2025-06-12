# di-account-management-frontend

[![Application Integration and Deployment](https://github.com/govuk-one-login/di-account-management-frontend/actions/workflows/main.yml/badge.svg)](https://github.com/govuk-one-login/di-account-management-frontend/actions/workflows/main.yml)
Also known as the Account Management Frontend (AMF).

## Clone the repo

Clone this repo to your local machine

```bash
git clone git@github.com:govuk-one-login/di-account-management-frontend.git ./your_folder_name
```

Clones the repository to the `your_folder_name` directory.

## Developer notes

### Pre-commit for Husky and Gitlint

This repository uses [pre-commit](https://pre-commit.com/) to run linting on all staged files before they're committed.
Install & setup pre-commit by running:

```bash
pip install pre-commit gitlint
pre-commit install -f
pre-commit install --hook-type commit-msg
```

When you make your first commit, pre-commit will fetch and install the hook configuration.
This may take a few minutes but won't need to be repeated for future commits.

### Logging with a trace id

See [One Login home developer notes](https://team-manual.account.gov.uk/teams/home-team/) in our section of the DI Manual.

## Running the app locally in Docker

We can run the Account Management frontend locally using our OIDC and Account Management API stubs deployed to the dev or build environment.
This means we don't need to register a new client with the Authentication team for each of us.

### Configure environment variables

Create a copy of the `.env.sample` file and rename it `.env`.
Ask another team member for the client ID and add that to your `.env` file.
All other values should be correct.

```
OIDC_CLIENT_ID=<client id>
```

### Setup the private key

Create a copy of the seed.yaml.sample, rename it seed.yaml and ask a team member for the value for the private key.

### Start the application

Run `docker compose build && docker compose up` to force a new build of the containers.

To find out if the application has started, open a console window on the docker container and view the logs. If the server has started successfully you will see this message `Server listening on port 6001`.

Navigate to [http://localhost:6001](http://localhost:6001). You should be redirected through the OIDC stub and back to the application.

Changes made locally will automatically be deployed after a few seconds. You should check the docker console to check that your changes have been picked up.

### Provisioning localstack

The application is now tightly integrated into AWS services.
We use localstack to mimic AWS when running locally.
The provisioning of the infra in localstack is done automatically on startup when calling `docker compose up`.
The provisioning and setup of the infra is done by the following script,
[provision script](https://github.com/govuk-one-login/di-account-management-frontend/tree/main/docs/localstack/provision.sh).
The script is mounted as volume onto localstack and invoked as soon as the container is ready.

#### DynamoDB

The user service store uses DynamoDB to render service cards on the root page of the application.
If that fails to connect the application may throw an error or not render any cards.

The `user_services` Dynamo table in localstack is provisioned with a user service record populated with a `user_id`.
The `user_id` value can be overridden in the
[provision script](https://github.com/govuk-one-login/di-account-management-frontend/tree/main/docs/localstack/provision.sh)
by explicitly setting `MY_ONE_LOGIN_USER_ID` env var in the same terminal where `docker compose up` is executed.
For this to work you will need to get your-subject-id from the build environment or session.

```bash
export MY_ONE_LOGIN_USER_ID=<your-subject-id>
```

Or [provide it on line 7](https://github.com/govuk-one-login/di-account-management-frontend/tree/main/docs/localstack/provision.sh#L7).

A DynamoDB table also provides tha applications session store, which automatically deletes expired sessions.
To facilitate destroying all sessions for a user upon account deletion or global logout,
the session store table has an index to allows the application to find all sessions by user.

The session store resources are also provisioned in localstack through the
[provision script](https://github.com/govuk-one-login/di-account-management-frontend/tree/main/docs/localstack/provision.sh)

### Running the tests

The unit tests have been written with Mocha and Supertest.

You'll be able to run the unit tests from outside the container

```shell
npm run test:unit
```

The integration tests need localstack to run successfully.
The easiest way is to start the docker compose stack and run the tests from inside the app container.

```shell script
docker exec -it account-management-frontend /bin/sh

# npm run test:integration
```

### End-to-end tests

The end-to-end tests are written with [Playwright](https://playwright.dev/) and [Playwright BDD](https://vitalets.github.io/playwright-bdd).

#### Running the tests locally

Copy the file `end-to-end-tests/.env.sample` to `end-to-end-tests/.env`.

When running tests locally they are run against `http://localhost:6001` by default. Change the value of the environment variable `TEST_ENVIRONMENT` to one of `dev | build | staging | production` to run tests against the corresponding deployment instead.

If your machine has `AMD64` architecture then you can run the tests locally in Docker:

```bash
cd end-to-end-tests
docker build -t frontend-end-to-end-tests .
docker run -t frontend-end-to-end-tests # or docker run -t -v `pwd`/snapshots:/snapshots -v `pwd`/test-results:/test-results --network="host" frontend-end-to-end-tests if running the tests against localhost
```

This is also how the tests are run in the deployment pipeline so running the tests locally via Docker guarantees reproducible outcomes and is therefore the preferred option.

If your machine has `ARM64` architecture then running the tests in Docker won't work because the Docker image is Linux-based and at the time of writing there is no `ARM64` build of Chrome for Linux. Instead you can run the tests against a locally installed version of Chrome. This is also useful for running the tests in debug or UI mode:

```bash
cd end-to-end-tests
npm ci && npm run test
# npm ci && npm run test:debug to run tests in debug mode
# npm ci && npm run test:ui to run tests in UI mode
```

To avoid discrepancies between deployment pipeline and local test run outcomes ensure that your locally installed version of Chrome is up to date prior to running the tests.

TODO
update to explain how to run in Docker as the only method to run tests and update test snapshots
but explain that to run in ui mode for the debugging the tests should be run locally

### Restarting the app

You can restart the app by running `docker compose down` and then `docker compose up`.
You'll need to do this if you make changes to environment variables or the localstack config.

## Deploying to the development AWS account

We can deploy the app to our development environment for pre-merge testing.
Only one branch can be deployed at a time because registering an OIDC client with Auth is a manual process at the moment.
Before deploying, check with the team in the [#di-one-login-home-tech Slack channel](https://gds.slack.com/archives/C011Y5SAY3U) to see if anyone else is using it.

The [Verify and Publish to Dev](https://github.com/govuk-one-login/di-account-management-frontend/actions/workflows/on-manual-publish-to-dev.yml) Github action builds the Docker container, pushes it to ECR in the dev account and starts the deploy pipeline.
This action has a `workflow_dispatch` trigger which means we can click an button in Github and start it.

To deploy the app:

1. Rebase your branch onto `main`
2. Go to the [action page](https://github.com/govuk-one-login/di-account-management-frontend/actions/workflows/on-manual-publish-to-dev.yml) and click 'Run workflow'
3. Choose your branch from the dropdown
4. Select `Commit SHA, branch name or tag` - Provide the SHA, branch name or tag that you wish to deploy
5. Click 'Run workflow' again
6. Wait for the action to finish running
7. Wait for AWS Code Pipeline to finish the deploy
8. Go to https://home.dev.account.gov.uk to see the app (VPN required)

## Other useful npm commands

### Development

> To run the app in development mode with nodemon watching the files

```shell script
npm run dev
```

Starts a nodemon server serving the files from the `dist/`
directory.

### Build

> To build the app

```shell script
npm run build
```

### Start

> To run the built app

```shell script
npm start
```

Starts a node server pointing to the entry point found in
the build directory.

### Unit tests

> To run the unit tests

```shell script
npm run test:unit
```

Runs all unit tests found in the `tests/unit/` directory
using mocha.

### Integration tests

> To run the integration tests

```shell script
npm run test:integration
```

### Install dependencies

> To install dependencies, run npm ci

```shell script
npm ci
```

Installs the dependencies required to run the application.

### Coverage

> To get a coverage report

```shell script
npm run test:coverage
```

### Linting

> To run lint checks

```shell script
npm run lint
```

Checks if the code conforms the linting standards.

### Profiling

> To run the different performance testing tools provided by clinic

Similarly to running the app locally in docker, profiling requires localstack to be running.

```shell script
npm run build # Required for every code change
npm run doctor # Diagnose performance issues in your Node.js applications
npm run flame # Uncovers the bottlenecks and hot paths in your code with flamegraphs
npm run bubbleprof #observes the async operations of your application, groups them, measures their delays, and draws a map of the delays in your application's async flow
npm run heap-profiler # Uncovers memory allocations by functions with Flamegraphs.
```

It is possible to run a performance test scenario against clinic as well.

```shell script
npm run build # Required for every code change
NODE_ENV=production clinic doctor -- node -r dotenv/config dist/server.js && echo '\n\nRemember to clean up files in .clinic and node_trace.*.log\n'
# Open the performance testing repo for OLH and run the k6 script. (NOTE: You may have issues if the test runs for too long depending on which performance tool you are using and your laptops performance.)
# Wait for the performance test suite to complete.
# Stop the server.
```
