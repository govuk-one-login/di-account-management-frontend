resource "aws_cloudformation_stack" "account_mgmt_frontend_pipeline" {
  name         = "account-mgmt-frontend-pipeline"
  template_url = "https://template-storage-templatebucket-1upzyw6v9cs42.s3.amazonaws.com/sam-deploy-pipeline/template-v2.105.1.yaml"

  parameters = {
    AbortOnCheckovFailure                           = "CONTINUE"
    AccessLogsCustomBucketNameEnabled               = "Yes"
    AdditionalCodeSigningVersionArns                = "arn:aws:signer:eu-west-2:354770603991:/signing-profiles/SigningProfile_SxeU7YX0F6Pb/HyVGO9gC7b"
    AllowCrossAccountS3WriteAccess                  = "False"
    AllowedAccounts                                 = var.pipelineAllowedAccounts
    AllowedServiceOne                               = "none"
    AllowedServiceTwo                               = "none"
    AllowedServiceThree                             = "none"
    AllowedServiceFour                              = "none"
    AllowedServiceFive                              = "none"
    AllowedServiceSix                               = "none"
    AllowedServiceSeven                             = "none"
    ArtifactSourceBucketArn                         = var.pipelineArtifactSourceBucketArn
    ArtifactSourceBucketEventTriggerRoleArn         = "none"
    ArtifactWriteTimeLoggingLambdaArn               = "None"
    AWSOrganizationId                               = var.pipelineAWSOrganizationId
    BuildNotificationStackName                      = "platform-alerting" # see https://github.com/govuk-one-login/one-login-home-infra/blob/4e68ccb93248595f0962b82f632324e72214c387/platform-alerting/README.md
    CircuitBreaker                                  = "Disabled"
    ContainerSignerKmsKeyArn                        = var.pipelineContainerSignerKmsKeyArn
    CustomKmsKeyArns                                = var.pipelineCustomKmsKeyArns
    DynamicResourcesPrefix                          = "none"
    ECSCanaryDeployment                             = var.pipelineECSCanaryDeployment
    Environment                                     = var.environment
    GitHubOrganizationName                          = "govuk-one-login"
    GitHubRepositoryName                            = var.pipelineGitHubRepositoryName
    IncludePromotion                                = var.pipelineIncludePromotion
    InvokableLambdaAccounts                         = "none"
    LambdaCanaryDeployment                          = "None"
    LogRetentionDays                                = 90
    OneLoginRepositoryName                          = "none"
    ParallelTestComputeType                         = "BUILD_GENERAL1_SMALL"
    ParallelTestCoverageReportFormat                = "CLOVERXML"
    ParallelTestImageRepositoryUri                  = "none"
    ParallelTestReportFormat                        = "JUNITXML"
    ParallelTestStackName                           = "None"
    ParallelTestStageName                           = "ParallelTest"
    PipelineEnvironmentNameEnabled                  = "No"
    ProgrammaticPermissionsBoundary                 = "False"
    RequireManualApproval                           = "No"
    RequireParallelTestContainerSignatureValidation = "No"
    RequireTestContainerSignatureValidation         = "No"
    RunParallelTestContainerInVPC                   = "False"
    RunTestContainerInVPC                           = var.pipelineRunTestContainerInVPC
    SAMStackName                                    = "account-mgmt-frontend"
    ServiceName                                     = "none"
    SigningProfileArn                               = var.pipelineSigningProfileArn
    SigningProfileVersionArn                        = var.pipelineSigningProfileVersionArn
    SlackNotificationType                           = var.pipelineSlackNotificationType
    StepFunctionsCanaryDeployment                   = "None"
    StoreTestReportInS3Bucket                       = "No"
    SubEnvironment                                  = "none"
    TestComputeType                                 = "BUILD_GENERAL1_SMALL"
    TestContainerAllowCrossAccountAssumeRole        = "No"
    TestCoverageReportFormat                        = "CLOVERXML"
    TestImageRepositoryUri                          = var.pipelineTestImageRepositoryUri != null ? var.pipelineTestImageRepositoryUri : try(aws_cloudformation_stack.account_mgmt_frontend_test_runner_image[0].outputs["TestRunnerImageEcrRepositoryUri"], "none")
    TestReportFormat                                = var.pipelineTestReportFormat
    TestStackName                                   = "None"
    TestStageName                                   = "Test"
    TrafficTestImageRepositoryUri                   = "none"
    TruncatedPipelineStackName                      = "none"
    VpcStackName                                    = "vpc-enhanced"
  }

  capabilities = var.capabilities
  depends_on   = [aws_cloudformation_stack.vpc_stack]
}

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
    LogDestination                                                 = "LogGroupOnly"
    OriginCloakingHeader                                           = "none"
    OriginCloakingHeaderManagedSecretAlarmSNSTopicARN              = var.originCloakingHeaderManagedSecretAlarmSNSTopicARN
    OriginCloakingHeaderManagedSecretNotificationSNSTopicARN       = var.originCloakingHeaderManagedSecretNotificationSNSTopicARN
    OriginCloakingHeaderManagedSecretNotificationSNSTopicKMSKeyARN = var.originCloakingHeaderManagedSecretNotificationSNSTopicKMSKeyARN
    OriginCloakingHeaderManagedSecretPreviousVersion               = "AWSPREVIOUS" #pragma: allowlist secret
    OriginCloakingHeaderManagedSecretRotationMonthWeekDaySchedule  = "THU#3"       #pragma: allowlist secret
    OriginCloakingHeaderManagedSecretVersion                       = "AWSCURRENT"  #pragma: allowlist secret
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
    AllowRules                    = "pass tls $HOME_NET any -> $EXTERNAL_NET 443 (tls.sni; content:\"gov.uk\"; endswith; msg:\"Pass TLS to *.gov.uk\"; flow:established; sid:2001; rev:1;)\npass tls $HOME_NET any -> $EXTERNAL_NET 443 (tls.sni; content:\"api.notifications.service.gov.uk\"; endswith; msg:\"Pass TLS to *.notifications.service.gov.uk\"; flow:established; sid:2003; rev:1;)\npass tls $HOME_NET any -> $EXTERNAL_NET 443 (tls.sni; content:\"govuk1620731396.zendesk.com\"; endswith; msg:\"Pass TLS to *.zendesk.com\"; flow:established; sid:2002; rev:1;)"
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
    S3ApiEnabled                  = "Yes"
    SecretsManagerApiEnabled      = "Yes" #pragma: allowlist secret
    SNSApiEnabled                 = "Yes"
    SQSApiEnabled                 = "Yes"
    SSMApiEnabled                 = "Yes"
    SSMParametersStoreEnabled     = "Yes"
    StatesApiEnabled              = "Yes"
    VpcLinkEnabled                = "Yes"
    XRayApiEnabled                = "Yes"
    ZoneAEIPAllocationId          = "none"
    ZoneBEIPAllocationId          = "none"
    ZoneCEIPAllocationId          = "none"
  }

  capabilities = var.capabilities
}
