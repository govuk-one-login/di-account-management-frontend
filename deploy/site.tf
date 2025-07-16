terraform {
  required_version = "~> 1.12.0"

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  alias  = "virginia"
  region = "us-east-1"
}

provider "aws" {
  alias  = "london"
  region = "eu-west-2"
}
