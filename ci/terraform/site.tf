terraform {
  required_version = ">= 1.0.4"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.10.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.4.3"
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
}

provider "random" {}

data "aws_availability_zones" "available" {}

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

locals {
  default_tags = {
    environment = var.environment
    application = "account-management"
  }
}
