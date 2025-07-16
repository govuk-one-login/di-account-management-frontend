# Deploying this application

We deploy this application in two parts.
The main app container and resources (eg. the session store) are deployed from the Cloudformation template.
This is deployed with AWS SAM from our CI/CD pipeline.

There are some pre-requisite resources defined in other stacks.
These aren't updated often so we deploy them manually from a developer laptop using Terraform.

## Deploying Terraform

The Terraform uses separate backend configuration and variables files for each environment.
To deploy into eg. staging:

```sh
cd deploy
aws sso login --profile di-account-staging-admin
AWS_PROFILE=di-account-staging-admin terraform init -backend-config=env/backend/staging.tfbackend
AWS_PROFILE=di-account-staging-admin terraform plan -var-file=env/staging.tfvars
AWS_PROFILE=di-account-staging-admin terraform apply -var-file=env/staging.tfvars
```
