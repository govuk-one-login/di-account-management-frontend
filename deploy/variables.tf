variable "certAlternativeNameOne" {
  type        = string
  description = "Cert Alternative Domain Name"
}

variable "certDomainName" {
  type        = string
  description = "Cert Domain Name"
}

variable "certHostedZoneID" {
  type        = string
  description = "Cert Hosted Zone ID"
}

variable "cloudfrontDistributionAlias" {
  type        = string
  description = "CloudFront Distribution Alias"
}

variable "originCloakingHeaderManagedSecretAlarmSNSTopicARN" {
  type        = string
  description = "CloudFront Origin Cloaking Header Managed Secret Alarm SNS Topic ARN"
}

variable "originCloakingHeaderManagedSecretNotificationSNSTopicARN" {
  type        = string
  description = "CloudFront Origin Cloaking Header Managed Secret Notification SNS Topic ARN"
}

variable "originCloakingHeaderManagedSecretNotificationSNSTopicKMSKeyARN" {
  type        = string
  description = "CloudFront Origin Cloaking Header Managed Secret Notification SNS Topic KMS Key ARN"
}

variable "capabilities" {
  type    = list(string)
  default = ["CAPABILITY_NAMED_IAM", "CAPABILITY_AUTO_EXPAND"]
}

variable "environment" {
  type        = string
  description = "The environment name"
  validation {
    condition     = contains(["dev", "build", "staging", "integration", "production"], var.environment)
    error_message = "Valid values for var: environment are (dev, build, staging, integration, production)"
  }
}

variable "vpcLinkId" {
  type        = string
  description = "API Gateway VPC Link ID"
}
