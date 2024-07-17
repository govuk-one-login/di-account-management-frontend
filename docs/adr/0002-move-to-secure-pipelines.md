# Move to Secure Pipelines

## Summary

- The application will move from GOV.UK One Login Auth team AWS account to GOV.UK Account team AWS account
- The application will be deployed using 2022 [Developer Platform](https://govukverify.atlassian.net/wiki/spaces/PLAT/overview?homepageId=3033662033) best pratices ([Secure Delivery Pipelines](https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3052077059/Secure+Delivery+Pipelines))
- Infrastructure as code will migrate from Terraform to CloudFormation
- The app stack will continue to deploy as a containerised frontend app, running on AWS Fargate
- We will migrate the domain from `https://account.gov.uk/manage-your-account` to `https://home.account.gov.uk`

## Context

In Summer / Autumn 2022, ownership of the account management app moved from the GOV.UK One Login Authentication team, to the GOV.UK Account team.

Authentication build this app early on, and it uses a technical stack that is now no longer preferred on the program.

In addition the domain was chosen at an early stage in the program when few services were in production. Since then `account.gov.uk` has grown to serve a range of subdomains that are linked to teams and individual features (for example `https://identity.account.gov.uk`).

Having the account management app live on `account.gov.uk` makes it unique amongst other program services, and misses the chance to have a central team manage the program's "root" domain, and manage shared functions such as [HSTC](https://developer.mozilla.org/en-US/docs/Glossary/HSTS) which can be set there.

## Decision

### Move AWS account

We will migrate ownership of the Account management app without compromising on the programme secuirty model and access controls. As such we'll shift the application to run in a GOV.UK account team AWS account, and then migrate traffic. Access to the app will be governed by GOV.UK Account team permissions and the team will gain no unnecessary access to Authentication team resources.

These accounts will be:

- `di-account-build`
- `di-account-staging`
- `di-account-integration`
- `di-account-production`

### Migrate to secure pipelines

The latest GOV.UK One Login guidance is to use ([Secure Delivery Pipelines](https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3052077059/Secure+Delivery+Pipelines)) following Developer Platform best practices.

The account infrasturue is now legacy technical debt, reflecting how early in the programmes life it was spun up.

If we migrated the account with existing infrastructure we would have to later migrate it and take on responsibility for that technical debt. We have decided to tackle the problem now, and set up a new infrastructure reflecting best deployment pratices.

Deployment will no longer use concourse.

We will use [Cloud Formation](https://aws.amazon.com/cloudformation/) instead of [Terraform](https://www.terraform.io/) to describe infrastucture as code, to match Developer Platform standards.

### Move domain

We will move the domain and path of the account management app from:
`https://account.gov.uk/manage-your-account` to `https://home.account.gov.uk`

The GOV.UK Account team will own and manage the `home` subdomain.

Traffic will be redirected from `https://account.gov.uk/manage-your-account`, and redirects monitored.

Where a source of redirects can be found from GOV.UK or GOV.UK One Login pages, we will update the links or redirects to target the new canonical URL.

## Consequences

- The GOV.UK Account team will assume responsibility for the account management app.
- The Auth team will be able to simplify their deployment pipelines, removing account management related code
- We will need the teams to work together to shift traffic to the new application / account with zero downtime.
- We will need to support redirects from the old to new domain for a period.
