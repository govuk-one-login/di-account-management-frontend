variable "aws_region" {
  default = "eu-west-2"
}

variable "deployer_role_arn" {
  default = null
}

variable "cf_username" {
  description = "deployer username"
}

variable "cf_password" {
  description = "deployer password org"
}

variable "cf_org_name" {
  description = "target org"
}

variable "dns_state_bucket" {
  default = ""
}

variable "dns_state_key" {
  default = ""
}

variable "dns_state_role" {
  default = ""
}

variable "environment" {
  description = "the name of the environment being deployed (e.g. sandpit, build), this also matches the PaaS space name"
}

variable "account_management_fqdn" {
  default = null
}

variable "oidc_api_fqdn" {
  default = null
}

variable "account_management_api_fqdn" {
  default = null
}
variable "frontend_fqdn" {
  default = null
}


variable "service_domain" {
  default = null
}

variable "zone_id" {
  default = null
}

variable "redis_service_plan" {
  type        = string
  default     = "tiny-5_x"
  description = "The PaaS service plan (instance size) to use for Redis. For a full list of options, run 'cf marketplace -e redis'"
}

variable "redis_key" {
  type        = string
  description = "Key used to identity which SSM variables to read for Redis connection and authorisation"
}

variable "your_account_url" {
  type        = string
  description = "the url to the GOV.UK account - Your Account homepage"
}

variable "common_state_bucket" {
}

variable "redis_node_size" {
  default = "cache.t2.small"
}

variable "account_management_image_uri" {
  type = string
}

variable "account_management_ecs_cluster_id" {
  type = string
}

variable "account_management_ecs_security_groups" {
  type = list(string)
}

variable "account_management_ecs_subnets" {
  type = list(string)
}

variable "account_management_alb_security_groups" {
  type = list(string)
}

variable "account_management_alb_subnets" {
  type = list(string)
}

variable "account_management_alb_tls_cert" {
  type = string
}

variable "account_management_vpc_id" {
  type = string
}

variable "account_management_ecs_desired_count" {
  type    = number
  default = 3
}

variable "account_management_app_port" {
  type = number
}

variable "session_expiry" {
  type = string
}

variable "gtm_id" {
  type = string
}

variable "gov_accounts_publishing_api_url" {
  type = string
}

variable "gov_account_publishing_api_token" {
  type = string
}

variable "cookies_and_feedback_url" {
  type = string
}
