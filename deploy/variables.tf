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

variable "pipelineAllowedAccounts" {
  type    = string
  default = null
}

variable "pipelineArtifactSourceBucketArn" {
  type = string
}

variable "pipelineAWSOrganizationId" {
  type = string
}

variable "pipelineContainerSignerKmsKeyArn" {
  type = string
}

variable "pipelineCustomKmsKeyArns" {
  type    = string
  default = null
}

variable "pipelineECSCanaryDeployment" {
  type = string
}

variable "pipelineGitHubRepositoryName" {
  type = string
}

variable "pipelineIncludePromotion" {
  type = string
}

variable "pipelineRunTestContainerInVPC" {
  type = string
}

variable "pipelineSigningProfileArn" {
  type = string
}

variable "pipelineSigningProfileVersionArn" {
  type = string
}

variable "pipelineSlackNotificationType" {
  type = string
}

variable "pipelineTestImageRepositoryUri" {
  type    = string
  default = null
}

variable "pipelineTestReportFormat" {
  type = string
}

variable "tgwHubAccountId" {
  type        = string
  description = "AWS account ID of the Transit Gateway Hub for this environment (used by the tgw-cross-account-role stack). 'none' disables the spoke stacks for envs not yet migrated."
  default     = "none"
}

variable "spokeVpcCidrBlock" {
  type        = string
  description = "Non-overlapping CIDR block for the spoke VPC. The mask selects the devplatform VPC size (per TGHM 'Spoke VPC CIDR Blocks', page 5269422165): /20 Medium, /19 Large, /18 Xlarge, /17 XXLarge. Must not overlap the legacy vpc-enhanced 10.0.0.0/16."
  default     = "10.1.0.0/20"
}
