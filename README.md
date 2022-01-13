# di-authentication-account-management-frontend

## Clone the repo

> Clone this repo to your local machine

```shell script
git@github.com:alphagov/di-authentication-account-management.git
```

Clones the repository to the `<your_folder_name` directory.

## Running the app locally in Docker

Before you can run the frontend app against the backend you will need a usable client and configuration.

### Configure or find a usable client

The client created by the pipeline is not currently usable by a local account management application as the private key is not available and it does not redirect to local clients.  To run account management locally you will need to configure another client.

1. [Generate a key pair](https://auth-tech-docs.london.cloudapps.digital/generate-a-key/#generate-a-key-pair)
1. Copy an existing client in the database, or [register a new one](https://auth-tech-docs.london.cloudapps.digital/manage-your-service-s-configuration/#register-your-service-to-use-gov-uk-sign-in).
1. In the database update the following values:
    - SubjectType = public
    - ConsentRequired = 0
    - RedirectUrls = ["http://localhost:6001/auth/callback"]
    - Scopes = ["openid", "phone", "email", "am", "offline_access", "govuk-account"]
1. Copy and paste the public key from step 1.

### Set the Environment variables

Create a copy of the .env.sample file, rename it .env and fill in the value for the client id below.  All the other values should be correct.

```
OIDC_CLIENT_ID=<client id>
```

### Setup the private key

Copy the private key generated in step one and put it in `seed.yaml` with the correct identation.

### Update the WAF

The WAF will block attempts made by the local application to use the build api unless some rules are switched off.  This can be done temporarily in the build environment during testing.  When a deployment happens the rules will be reset, but it's a good idea to keep the rules the same in all environments as much as possible, so these rules have not been switched off permanently in build.

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

Navigate to http://localhost:6001.  You should be redirected to the 'sign-in-or-create' screen.

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
