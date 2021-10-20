data "terraform_remote_state" "dns" {
  count   = var.service_domain == null ? 1 : 0
  backend = "s3"
  config = {
    bucket   = var.dns_state_bucket
    key      = var.dns_state_key
    role_arn = var.dns_state_role
    region   = var.aws_region
  }
}

locals {
  service_domain = var.service_domain == null ? lookup(data.terraform_remote_state.dns[0].outputs, "${var.environment}_service_domain", "") : var.service_domain
}