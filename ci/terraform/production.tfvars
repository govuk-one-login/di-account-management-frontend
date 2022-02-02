redis_service_plan  = "large-ha-5_x"
environment         = "production"
your_account_url    = "https://www.gov.uk/account/home"
redis_node_size     = "cache.m4.xlarge"
common_state_bucket = "digital-identity-prod-tfstate"
public_access       = false

account_management_ecs_desired_count = 4
