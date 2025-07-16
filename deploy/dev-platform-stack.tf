resource "aws_cloudformation_stack" "certificate_stack" {
  provider     = aws.virginia
  name         = "devplatform-certificate"
  template_url = "https://template-storage-templatebucket-1upzyw6v9cs42.s3.amazonaws.com/certificate/template.yaml"

  parameters = {
    AddWWWPrefix       = "false"
    AlternativeNameOne = var.certAlternativeNameOne
    DomainName         = var.certDomainName
    HostedZoneID       = var.certHostedZoneID
  }

  capabilities = ["CAPABILITY_NAMED_IAM", "CAPABILITY_AUTO_EXPAND"]
}

resource "aws_cloudformation_stack" "cloudfront_stack" {
  provider     = aws.london
  name         = "devplatform-cloudfront"
  template_url = "https://template-storage-templatebucket-1upzyw6v9cs42.s3.amazonaws.com/cloudfront-distribution/template.yaml"

  parameters = {
    AddWWWPrefix                                                   = "false"
    CloudFrontWafACL                                               = "none"
    DistributionAlias                                              = var.cloudfrontDistributionAlias
    EnableCustomErrorPages                                         = "true"
    FraudHeaderEnabled                                             = "true"
    FraudHeadersFunctionName                                       = "TICFFraudHeadersCloudFrontFunction"
    LogDestination                                                 = "csls_cw_logs_destination_prodpython"
    OriginCloakingHeader                                           = "none"
    OriginCloakingHeaderManagedSecretAlarmSNSTopicARN              = var.originCloakingHeaderManagedSecretAlarmSNSTopicARN
    OriginCloakingHeaderManagedSecretNotificationSNSTopicARN       = var.originCloakingHeaderManagedSecretNotificationSNSTopicARN
    OriginCloakingHeaderManagedSecretNotificationSNSTopicKMSKeyARN = var.originCloakingHeaderManagedSecretNotificationSNSTopicKMSKeyARN
    OriginCloakingHeaderManagedSecretPreviousVersion               = "AWSPREVIOUS"
    OriginCloakingHeaderManagedSecretRotationMonthWeekDaySchedule  = "THU#3"
    OriginCloakingHeaderManagedSecretVersion                       = "AWSCURRENT"
    PreviousOriginCloakingHeader                                   = "none"
    StandardLoggingEnabled                                         = "true"
    CloudFrontCertArn                                              = aws_cloudformation_stack.certificate_stack.outputs["CertificateARN"]
  }

  tags = {
    FMSGlobalCustomPolicy     = "true"
    FMSGlobalCustomPolicyName = "cloudfront"
  }

  capabilities = ["CAPABILITY_NAMED_IAM", "CAPABILITY_AUTO_EXPAND"]

  depends_on = [aws_cloudformation_stack.certificate_stack]
}