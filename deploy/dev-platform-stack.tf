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
    OriginCloakingHeaderManagedSecretPreviousVersion               = "AWSPREVIOUS" #pragma: allowlist secret
    OriginCloakingHeaderManagedSecretRotationMonthWeekDaySchedule  = "THU#3" #pragma: allowlist secret
    OriginCloakingHeaderManagedSecretVersion                       = "AWSCURRENT" #pragma: allowlist secret
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

resource "aws_cloudformation_stack" "vpc_stack" {
  # See https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3531735041/VPC
  name         = "vpc-enhanced"
  template_url = "https://template-storage-templatebucket-1upzyw6v9cs42.s3.amazonaws.com/vpc/template.yaml"

  parameters = {
    AllowedDomains                = "*.account.gov.uk,*.service.gov.uk,*.settings.gov.uk,*.govuk.digital,*.zendesk.com,*.notifications.service.gov.uk,*.cloudfront.net"
    AllowRules                    = "pass tls $HOME_NET any -> $EXTERNAL_NET 443 (tls.sni; content:\"gov.uk\"; endswith; msg:\"Pass TLS to *.gov.uk\"; flow:established; sid:2001; rev:1;) pass tls $HOME_NET any -> $EXTERNAL_NET 443 (tls.sni; content:\"api.notifications.service.gov.uk\"; endswith; msg:\"Pass TLS to *.notifications.service.gov.uk\"; flow:established; sid:2003; rev:1;) pass tls $HOME_NET any -> $EXTERNAL_NET 443 (tls.sni; content:\"govuk1620731396.zendesk.com\"; endswith; msg:\"Pass TLS to *.zendesk.com\"; flow:established; sid:2002; rev:1;)"
    AvailabilityZoneCount         = "2"
    CidrBlock                     = "10.0.0.0/16"
    CloudFormationEndpointEnabled = "Yes"
    CodeBuildApiEnabled           = "Yes"
    DynamoDBApiEnabled            = "Yes"
    DynatraceApiEnabled           = "Yes"
    ECRApiEnabled                 = "Yes"
    ExecuteApiGatewayEnabled      = "Yes"
    KMSApiEnabled                 = "Yes"
    LambdaApiEnabled              = "Yes"
    LogsApiEnabled                = "Yes"
    NibCrossZoneEnabled           = "Yes"
    S3ApiEnabled                  = "Yes"
    SecretsManagerApiEnabled      = "Yes" #pragma: allowlist secret
    SNSApiEnabled                 = "Yes"
    SQSApiEnabled                 = "Yes"
    SSMApiEnabled                 = "Yes"
    SSMParametersStoreEnabled     = "Yes"
    StatesApiEnabled              = "Yes"
    VPCLinkEnabled                = "Yes"
    VPCPeeringConnectionId        = "none"
    VPCPeeringRequesterCIDR       = "none"
    XRayApiEnabled                = "Yes"
    ZoneAEIPAllocationId          = "none"
    ZoneBEIPAllocationId          = "none"
    ZoneCEIPAllocationId          = "none"
  }

  capabilities = var.capabilities
}
