environment         = "production"
your_account_url    = "https://www.gov.uk/account/home"
redis_node_size     = "cache.m4.xlarge"
common_state_bucket = "digital-identity-prod-tfstate"

account_management_ecs_desired_count = 4

logging_endpoint_arns = [
  "arn:aws:logs:eu-west-2:885513274347:destination:csls_cw_logs_destination_prodpython"
]

account_management_redirect_url = "https://home.account.gov.uk"
