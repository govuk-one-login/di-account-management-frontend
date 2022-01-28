redis_service_plan  = "tiny-ha-5_x"
environment         = "build"
your_account_url    = ""
common_state_bucket = "digital-identity-dev-tfstate"
deploy_listener     = true

# The below are just temporary, and will be removed once they can be injected in the deployment pipeline
account_management_image_uri    = "761723964695.dkr.ecr.eu-west-2.amazonaws.com/sandpit-account-management-image-repository"
account_management_image_digest = "sha256:8ffb5f019ace92827442354a045783ba4916c057a13b6489b58df11a1cd9f0de"
