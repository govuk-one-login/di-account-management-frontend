terraform {
  required_version = ">= 1.0.4"

  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = ">= 3.56.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1.0"
    }
    cloudfoundry = {
      source  = "cloudfoundry-community/cloudfoundry"
      version = "0.14.2"
    }
  }

  backend "s3" {
  }
}

provider "aws" {
  region = var.aws_region

  assume_role {
    role_arn = var.deployer_role_arn
  }

  default_tags {
    tags = {
      Environment = var.environment
      Application = "account-management"
    }
  }
}

provider "cloudfoundry" {
  api_url      = "https://api.london.cloud.service.gov.uk"
  user         = var.cf_username
  password     = var.cf_password
  app_logs_max = 250
}

provider "random" {}
