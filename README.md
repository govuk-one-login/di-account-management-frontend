# di-authentication-account-management frontend

[![Application Integration and Deployment](https://github.com/alphagov/di-authentication-account-management/actions/workflows/main.yml/badge.svg)](https://github.com/alphagov/di-authentication-account-management/actions/workflows/main.yml)  
Also known as the Account Management Frontend (AMF).

## Clone the repo

Clone this repo to your local machine
```bash
git clone git@github.com:alphagov/di-authentication-account-management.git ./your_folder_name
```

Clones the repository to the `your_folder_name` directory.

## Running the app locally in Docker

Before you can run the frontend app against the backend you will need a usable client and configuration.

### Configure or find a usable client

The client created by the pipeline is not currently usable by a local account management application as the private key is not available and it does not redirect to local clients. To run account management locally you will need to configure another client.

If you are a member of the GOV.UK Account team, as a colleague if they have existing config they can share with you.

If you need to generate new config follow the steps below.

1. [Generate a key pair](https://auth-tech-docs.london.cloudapps.digital/integrate-with-integration-environment/generate-a-key/)
1. Ask the [Auth team](https://di-team-manual.london.cloudapps.digital/authentication/) to copy an existing client in the database, or [register a new one](https://auth-tech-docs.london.cloudapps.digital/integrate-with-integration-environment/manage-your-service-s-configuration/#manage-your-service-s-configuration-with-gov-uk-sign-in).
1. If the Auth team ask for configuration values, tell them we need:
   - SubjectType = public
   - ConsentRequired = 0
   - RedirectUrls = ["http://localhost:6001/auth/callback"]
   - Scopes = ["openid", "phone", "email", "am", "offline_access", "govuk-account"]
1. Send the Auth team the public key generated in step 1.

### Set the Environment variables

Create a copy of the .env.sample file, rename it .env and fill in the value for the client id below. All the other values should be correct.

```
OIDC_CLIENT_ID=<client id>
```

### Setup the private key

Create a copy of the seed.yaml.sample, rename it seed.yaml and fill in the value for the private key, using the key generated above or shared by a colleague.

### Start the application

Run the `docker compose up` command.

To find out if the application has started, open a console window on the docker container and view the logs. If the server has started successfully you will see this message `Server listening on port 6001`.

Navigate to [http://localhost:6001](http://localhost:6001). You should be redirected to the 'sign-in-or-create' screen.

Sign in and make sure you are returned to the local 'your-services' screen.

Changes made locally will automatically be deployed after a few seconds. You should check the docker console to check that your changes have been picked up.

### Provisioning localstack

The application is now quite tightly integrated into AWS services.
For certain features to run locally, we'll need localstack running and provisioned to facilitate requests.  

The provisioning of the infra in localstack is done automatically on startup when calling `docker compose up`.
The provisioning and setup of the infra is done by following script, 
[provision script](https://github.com/alphagov/di-authentication-account-management/tree/main/docs/localstack/provision.sh).
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
[provision script](https://github.com/alphagov/di-authentication-account-management/tree/main/docs/localstack/provision.sh) 
by explicitly setting `MY_ONE_LOGIN_USER_ID` env var in the same terminal where `docker compose up` is executed.  
For this to work you will need to get your-subject-id from the build environment or session.

```bash
export MY_ONE_LOGIN_USER_ID=<your-subject-id>
```
Or [provide it on line 7](https://github.com/alphagov/di-authentication-account-management/tree/main/docs/localstack/provision.sh#L7).

A DynamoDB table also provides tha applications session store, which automatically deletes expired sessions.
To facilitate destroying all sessions for a user upon account deletion or global logout, 
the session store table has an index to allows the application to find all sessions by user.

The session store resources are also provisioned in localstack through the
[provision script](https://github.com/alphagov/di-authentication-account-management/tree/main/docs/localstack/provision.sh)

### Running the tests
The unit tests have been written with Mocha and Supertest.

If the app is run in a container then the tests are run there too:

```shell script
docker exec -it di-auth-account-management-frontend-dev /bin/sh

# yarn run test:unit
```

### Restarting the app
You can restart the app by re-running the `docker compose down` and then `docker compose up`.

## Deploying to the development AWS account
We can deploy the app to our development environment for pre-merge testing.
Only one branch can be deployed at a time because registering an OIDC client with Auth is a manual process at the moment.
Before deploying, check with the team in the [#govuk-accounts-tech Slack channel](https://gds.slack.com/archives/C011Y5SAY3U) to see if anyone else is using it.

The [Verify and Publish to Dev](https://github.com/alphagov/di-authentication-account-management/actions/workflows/cd-only.yml) Github action builds the Docker container, pushes it to ECR in the dev account and starts the deploy pipeline.
This action has a `workflow_dispatch` trigger which means we can click an button in Github and start it.

To deploy the app:

1. Rebase your branch onto `main`
2. Go to the [action page](https://github.com/alphagov/di-authentication-account-management/actions/workflows/cd-only.yml) and click 'Run workflow'
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

Under the [Actions Tab](https://github.com/alphagov/di-authentication-account-management/actions) there is a [Verify & Publish to Dev](https://github.com/alphagov/di-authentication-account-management/actions/workflows/cd-only.yml) action.

Github action builds the Docker container, pushes it to ECR in the dev account and starts the deploy pipeline.
This action has a `workflow_dispatch` trigger which means we can click an button in Github and start it.

To deploy the app:

1. Rebase your branch onto `main`
1. Go to the [action page](https://github.com/alphagov/di-authentication-account-management/actions/workflows/cd-only.yml) and click 'Run workflow'
1. Use workflow from branch `main` - Leave this at the default unless you are modifying the workflow
1. Select `Commit SHA, branch name or tag` - Provide the SHA, branch name or tag that you wish to deploy.
1. Wait for the action to finish running
1. Log into the development AWS account (`gds aws di-account-dev -l`)
1. Go to the [CodePipeline job](https://eu-west-2.console.aws.amazon.com/codesuite/codepipeline/pipelines/account-mgmt-frontend-pipeline-Pipeline-1RV59OLATETA7/view?region=eu-west-2) for the frontend
1. Approve the pipeline run
1. Wait for the pipeline to finish
1. Go to https://home.dev.account.gov.uk to see the app (VPN required)

## Other useful yarn commands

### Development

> To run the app in development mode with nodemon watching the files

```shell script
yarn dev
```

Starts a nodemon server serving the files from the `dist/`
directory.

### Build

> To build the app

```shell script
yarn build
```

### Start

> To run the built app

```shell script
yarn start
```

Starts a node server pointing to the entry point found in
the build directory.

### Unit tests

> To run the unit tests

```shell script
yarn test:unit
```

Runs all unit tests found in the `tests/unit/` directory
using mocha.

### Integration tests

> To run the integration tests

```shell script
yarn test:integration
```

### Install dependencies

> To install dependencies, run yarn install

```shell script
yarn install
```

Installs the dependencies required to run the application.

### Coverage

> To get a coverage report

```shell script
yarn test:coverage
```

### Linting

> To run lint checks

```shell script
yarn lint
```

Checks if the code conforms the linting standards.
