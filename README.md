# di-authentication-account-management-frontend

## Clone the repo

> Clone this repo to your local machine

```shell script
git@github.com:alphagov/di-authentication-account-management.git
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

### Update the WAF

The WAF will block attempts made by the local application to use the build api unless some rules are switched off. This can be done temporarily in the build environment during testing. When a deployment happens the rules will be reset, but it's a good idea to keep the rules the same in all environments as much as possible, so these rules have not been switched off permanently in build.

1. Log into the AWS console
1. Go to 'WAF & Shield'
1. Select 'Web ACLs'
1. Change the region to 'eu-west-2'
1. Click 'build-oidc-waf-web-acl'
1. Choose the 'Rules' tab
1. Click 'build-oidc-common-rule-set'
1. Click 'Edit' button
1. In the list of rules set the count switches for 'EC2MetaDataSSRF_BODY' and 'EC2MetaDataSSRF_QUERYARGUMENTS' to on.
1. Click 'Save rule'
1. Click 'Save'

### Start the application

Run the `docker compose up` command.

To find out if the application has started, open a console window on the docker container and view the logs. If the server has started successfully you will see this message `Server listening on port 6001`.

Navigate to http://localhost:6001. You should be redirected to the 'sign-in-or-create' screen.

Sign in and make sure you are returned to the local 'manage-your-account' screen.

Changes made locally will automatically be deployed after a few seconds. You should check the docker console to check that your changes have been picked up.

### Running the tests

The unit tests have been written with Mocha and Supertest.

If the app is run in a container then the tests are run there too:

```shell script
docker exec -it di-auth-account-management-frontend-dev /bin/sh

# yarn run test:unit
```

### Restarting the app

You can restart the app by re-running the `docker compose down` and then `docker compose up`.

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
