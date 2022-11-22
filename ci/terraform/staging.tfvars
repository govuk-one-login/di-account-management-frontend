environment         = "staging"
your_account_url    = "https://www.staging.publishing.service.gov.uk/account/home"
common_state_bucket = "di-auth-staging-tfstate"

account_management_auto_scaling_enabled = true
support_language_cy                     = "1"

logging_endpoint_arns = [
  "arn:aws:logs:eu-west-2:885513274347:destination:csls_cw_logs_destination_prodpython"
]

account_management_redirect_url = "https://home.staging.account.gov.uk"