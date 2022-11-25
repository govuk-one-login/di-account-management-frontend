account_management_fqdn                   = "sandpit.auth.ida.digital.cabinet-office.gov.uk"
oidc_api_fqdn                             = "api.sandpit.auth.ida.digital.cabinet-office.gov.uk"
frontend_fqdn                             = "signin.sandpit.auth.ida.digital.cabinet-office.gov.uk"
account_management_api_fqdn               = "acct-mgmt-api.sandpit.auth.ida.digital.cabinet-office.gov.uk"
service_domain                            = "sandpit.auth.ida.digital.cabinet-office.gov.uk"
zone_id                                   = "Z050645231Q0HZAX6FT5W"
environment                               = "sandpit"
your_account_url                          = "https://account-management.sandpit.auth.ida.digital.cabinet-office.gov.uk"
common_state_bucket                       = "digital-identity-dev-tfstate"
session_expiry                            = 1800000
gtm_id                                    = ""
gov_accounts_publishing_api_url           = ""
gov_account_publishing_api_token          = ""
support_international_numbers             = 0
support_language_cy                       = "1"
support_mfa_options                       = "1"
account_management_task_definition_cpu    = 256
account_management_task_definition_memory = 512
account_management_auto_scaling_enabled   = true

logging_endpoint_arns = [
  "arn:aws:logs:eu-west-2:885513274347:destination:csls_cw_logs_destination_prodpython"
]

account_management_redirect_url = "http://localhost"
shared_state_bucket             = "digital-identity-dev-tfstate"
