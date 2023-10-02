# di-account-management-frontend

[![Application Integration and Deployment](https://github.com/alphagov/di-account-management-frontend/actions/workflows/main.yml/badge.svg)](https://github.com/alphagov/di-account-management-frontend/actions/workflows/main.yml)
Also known as the Account Management Frontend (AMF).

## Clone the repo

Clone this repo to your local machine

```bash
git clone git@github.com:alphagov/di-account-management-frontend.git ./your_folder_name
```

Clones the repository to the `your_folder_name` directory.

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

The application is now quite tightly integrated into AWS services.
For certain features to run locally, we'll need localstack running and provisioned to facilitate requests.

The provisioning of the infra in localstack is done automatically on startup when calling `docker compose up`.
The provisioning and setup of the infra is done by following script,
[provision script](https://github.com/alphagov/di-account-management-frontend/tree/main/docs/localstack/provision.sh).
The script is mounted as volume onto localstack and invoked as soon as the container is ready.

#### Setting up an AWS test user

You will need to have a profile in AWS vault prepared you can use for local testing.

You can list your AWS profiles with the aws-vault command.

```bash
aws-vault ls
```

If you do not have an appropriate one you can create one with dummy keys suitable for localstack with:

```bash
aws configure set aws_access_key_id "na" --profile test-profile
aws configure set aws_secret_access_key "na" --profile test-profile
aws configure set region "eu-west-2" --profile test-profile
```

#### DynamoDB

The user service store uses DynamoDB to render service cards on the root page of the application.
If that fails to connect the application may throw an error or not render any cards.

The `user_services` Dynamo table in localstack is provisioned with a user service record populated with a `user_id`.
The `user_id` value can be overridden in the
[provision script](https://github.com/alphagov/di-account-management-frontend/tree/main/docs/localstack/provision.sh)
by explicitly setting `MY_ONE_LOGIN_USER_ID` env var in the same terminal where `docker compose up` is executed.
For this to work you will need to get your-subject-id from the build environment or session.

```bash
export MY_ONE_LOGIN_USER_ID=<your-subject-id>
```

Or [provide it on line 7](https://github.com/alphagov/di-account-management-frontend/tree/main/docs/localstack/provision.sh#L7).

A DynamoDB table also provides tha applications session store, which automatically deletes expired sessions.
To facilitate destroying all sessions for a user upon account deletion or global logout,
the session store table has an index to allows the application to find all sessions by user.

The session store resources are also provisioned in localstack through the
[provision script](https://github.com/alphagov/di-account-management-frontend/tree/main/docs/localstack/provision.sh)

### Running the tests

The unit tests have been written with Mocha and Supertest.

If the app is run in a container then the tests are run there too:

```shell script
docker exec -it di-auth-account-management-frontend-dev /bin/sh

# npm run test:unit
```

### Restarting the app

You can restart the app by re-running the `docker compose down` and then `docker compose up`.

## Deploying to the development AWS account

We can deploy the app to our development environment for pre-merge testing.
Only one branch can be deployed at a time because registering an OIDC client with Auth is a manual process at the moment.
Before deploying, check with the team in the [#govuk-accounts-tech Slack channel](https://gds.slack.com/archives/C011Y5SAY3U) to see if anyone else is using it.

The [Verify and Publish to Dev](https://github.com/alphagov/di-account-management-frontend/actions/workflows/on-manual-publish-to-dev.yml) Github action builds the Docker container, pushes it to ECR in the dev account and starts the deploy pipeline.
This action has a `workflow_dispatch` trigger which means we can click an button in Github and start it.

To deploy the app:

1. Rebase your branch onto `main`
2. Go to the [action page](https://github.com/alphagov/di-account-management-frontend/actions/workflows/on-manual-publish-to-dev.yml) and click 'Run workflow'
3. Choose your branch from the dropdown, then click 'Run workflow' again
4. Wait for the action to finish running
5. Log into the development AWS account (`gds aws di-account-dev -l`)
6. Go to the [CodePipeline job](https://eu-west-2.console.aws.amazon.com/codesuite/codepipeline/pipelines/account-mgmt-frontend-pipeline-Pipeline-1RV59OLATETA7/view?region=eu-west-2) for the frontend
7. Approve the pipeline run
8. Wait for the pipeline to finish
9. Go to https://home.dev.account.gov.uk to see the app (VPN required)

## Branch Deploys

We can deploy the app to our development environment (`di-account-dev`) for pre-merge testing.
Only one branch can be deployed at a time because registering an OIDC client with Auth is a manual process at the moment.
Before deploying, check with the team in the [#govuk-accounts-tech Slack channel](https://gds.slack.com/archives/C011Y5SAY3U) to see if anyone else is using it.

Under the [Actions Tab](https://github.com/alphagov/di-account-management-frontend/actions) there is a [Verify & Publish to Dev](https://github.com/alphagov/di-account-management-frontend/actions/workflows/on-manual-publish-to-dev.yml) action.

Github action builds the Docker container, pushes it to ECR in the dev account and starts the deploy pipeline.
This action has a `workflow_dispatch` trigger which means we can click an button in Github and start it.

To deploy the app:

1. Rebase your branch onto `main`
1. Go to the [action page](https://github.com/alphagov/di-account-management-frontend/actions/workflows/on-manual-publish-to-dev.yml) and click 'Run workflow'
1. Use workflow from branch `main` - Leave this at the default unless you are modifying the workflow
1. Select `Commit SHA, branch name or tag` - Provide the SHA, branch name or tag that you wish to deploy.
1. Wait for the action to finish running
1. Log into the development AWS account (`gds aws di-account-dev -l`)
1. Go to the [CodePipeline job](https://eu-west-2.console.aws.amazon.com/codesuite/codepipeline/pipelines/account-mgmt-frontend-pipeline-Pipeline-1RV59OLATETA7/view?region=eu-west-2) for the frontend
1. Approve the pipeline run
1. Wait for the pipeline to finish
1. Go to https://home.dev.account.gov.uk to see the app (VPN required)

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

> To install dependencies, run npm install

```shell script
npm install
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
