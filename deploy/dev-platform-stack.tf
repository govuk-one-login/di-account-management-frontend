provider "aws" {
  alias  = "virginia"
  region = "us-east-1"
}

provider "aws" {
  alias  = "london"
  region = "eu-west-2"
}

data "local_file" "cert_cf_template" {
  filename = "/Users/peter.fajemisin/development/repos/devplatform-deploy/certificate/template.yaml"
}

data "local_file" "frontend_cf_template" {
  filename = "/Users/peter.fajemisin/development/repos/di-account-management-frontend/deploy/template.yaml"
}

# Deploy ACM Certificate first
resource "aws_cloudformation_stack" "certificate_stack" {
  provider      = aws.virginia
  name          = "devplatform-certificate"
  template_body = data.local_file.cert_cf_template.content


  parameters = {
    AddWWWPrefix = "false"
    AlternativeNameOne = "origin.home.dev.account.gov.uk"
    DomainName = "home.dev.account.gov.uk"
    HostedZoneID = "Z042182139ZC2BTUCMZ37"
  }

  capabilities = ["CAPABILITY_NAMED_IAM"]
}

resource "aws_cloudformation_stack" "cloudfront_stack" {
  provider      = aws.london
  name          = "devplatform-cloudfront"
  template_url = "https://template-storage-templatebucket-1upzyw6v9cs42.s3.amazonaws.com/cloudfront-distribution/template.yaml"

  parameters = {
    AddWWWPrefix = "false"
    CloudFrontWafACL = "none"
    DistributionAlias = "home.dev.account.gov.uk"
    EnableCustomErrorPages = "true"
    FraudHeaderEnabled = "true"
    FraudHeadersFunctionName = "TICFFraudHeadersCloudFrontFunction"
    LogDestination = "csls_cw_logs_destination_prodpython"
    OriginCloakingHeader = "none"
    OriginCloakingHeaderManagedSecretAlarmSNSTopicARN = "arn:aws:sns:eu-west-2:985326104449:platform-alerting-BuildNotificationTopic"
    OriginCloakingHeaderManagedSecretNotificationSNSTopicARN = "arn:aws:sns:eu-west-2:985326104449:platform-alerting-BuildNotificationTopic"
    OriginCloakingHeaderManagedSecretNotificationSNSTopicKMSKeyARN = "arn:aws:kms:eu-west-2:985326104449:key/337a80b6-5117-4c16-81b6-c017d7283605"
    OriginCloakingHeaderManagedSecretPreviousVersion = "AWSPREVIOUS"
    OriginCloakingHeaderManagedSecretRotationMonthWeekDaySchedule = "THU#3"
    OriginCloakingHeaderManagedSecretVersion = "AWSCURRENT"
    PreviousOriginCloakingHeader = "none"
    StandardLoggingEnabled = "true"
    CloudFrontCertArn = aws_cloudformation_stack.certificate_stack.outputs["CertificateARN"]
  }

  tags = {
    FMSGlobalCustomPolicy = "true"
    FMSGlobalCustomPolicyName = "cloudfront"
  }

  capabilities = ["CAPABILITY_NAMED_IAM", "CAPABILITY_AUTO_EXPAND"]

  depends_on = [aws_cloudformation_stack.certificate_stack]
}

resource "aws_cloudformation_stack" "frontend_stack" {
  provider      = aws.london
  name          = "devplatform-cloudfront"
  template_body = data.local_file.frontend_cf_template.content
  parameters = {
    ActivityLogTableName = "activity_log"
    AlertingStackName = "platform-alerting"
    BackendStackName = "account-mgmt-backend"
    CodeSigningConfigArn = "arn:aws:lambda:eu-west-2:985326104449:code-signing-config:csc-0426ad10dd582a7d7"
    ContainerPort = "6001"
    DeploymentStrategy = "CodeDeployDefault.ECSAllAtOnce"
    ELB4XXAlarmMetric = "HTTPCode_Target_4XX_Count"
    Environment = "dev"
    NotificationTopicArn = "arn:aws:sns:eu-west-2:985326104449:platform-alerting-BuildNotificationTopic"
    OwnerTagValue = "govuk-accounts-tech@digital.cabinet-office.gov.uk"
    PermissionsBoundary = "arn:aws:iam::985326104449:policy/account-mgmt-frontend-pipeline-AppPermissionsBoundary-0a6cc7ce271a"
    ProductTagValue = "GOV.UK Sign In"
    ServiceStoreTableName = "user_services"
    SourceTagValue = "govuk-one-login/di-account-management-frontend/deploy/template.yaml"
    StubsStackName = "account-mgmt-stubs"
    SystemTagValue = "Accounts"
    VpcStackName = "vpc-enhanced"
  }

  tags = {
    Environment = "dev"
    is-pipeline-deployment = "False"
    Owner = "govuk-accounts-tech@digital.cabinet-office.gov.uk"
    Product = "GOV.UK Sign In"
    repository = "govuk-one-login/di-account-management-frontend"
    System = "Accounts"
  }

  capabilities = ["CAPABILITY_NAMED_IAM", "CAPABILITY_AUTO_EXPAND"]

  depends_on = [aws_cloudformation_stack.certificate_stack]
}