redis_service_plan  = "large-ha-5_x"
environment         = "production"
your_account_url    = "https://www.gov.uk/account/home"
redis_node_size     = "cache.m4.xlarge"
common_state_bucket = "digital-identity-prod-tfstate"
deploy_listener     = false

# The below are just temporary, and will be removed once they can be injected in the deployment pipeline
account_management_image_uri           = "761723964695.dkr.ecr.eu-west-2.amazonaws.com/sandpit-account-management-image-repository"
account_management_image_digest        = "sha256:8ffb5f019ace92827442354a045783ba4916c057a13b6489b58df11a1cd9f0de"
