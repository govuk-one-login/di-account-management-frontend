resource "aws_kms_key" "account_management_jwt_key" {
  description              = "KMS key for Account Management JWT Authentication (${var.environment})"
  deletion_window_in_days  = 30
  key_usage                = "SIGN_VERIFY"
  customer_master_key_spec = "RSA_2048"
}

resource "aws_kms_alias" "account_management_jwt_alias" {
  name          = "alias/${var.environment}-account-management-jwt-key"
  target_key_id = aws_kms_key.account_management_jwt_key.key_id
}

data "aws_iam_policy_document" "account_management_jwt_kms_policy_document" {
  statement {
    sid    = "AllowAccessToKmsSigningKey"
    effect = "Allow"

    actions = [
      "kms:Sign",
      "kms:GetPublicKey",
    ]
    resources = [
      aws_kms_key.account_management_jwt_key.arn,
    ]
  }
}

resource "aws_iam_policy" "account_management_jwt_lambda_kms_policy" {
  name        = "${var.environment}-account-management-jwt-kms-policy"
  path        = "/"
  description = "IAM policy for managing KMS connection for account management application"

  policy = data.aws_iam_policy_document.account_management_jwt_kms_policy_document.json
}

resource "aws_iam_user" "account_management_app" {
  name = "${var.environment}-account-management-application"
}

resource "aws_iam_user_policy_attachment" "account_management_app_kms_policy" {
  policy_arn = aws_iam_policy.account_management_jwt_lambda_kms_policy.arn
  user       = aws_iam_user.account_management_app.name
}

resource "aws_iam_access_key" "account_management_app_access_keys" {
  user = aws_iam_user.account_management_app.name
}

data "aws_iam_policy_document" "account_management_app_role_assume_policy" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    principals {
      identifiers = [
        aws_iam_user.account_management_app.arn
      ]
      type = "AWS"
    }

    actions = [
      "sts:AssumeRole"
    ]
  }
}

resource "aws_iam_role" "account_management_app_role" {
  assume_role_policy = data.aws_iam_policy_document.account_management_app_role_assume_policy.json
}

resource "aws_iam_role_policy_attachment" "account_management_app_kms" {
  role       = aws_iam_role.account_management_app_role.name
  policy_arn = aws_iam_policy.account_management_jwt_lambda_kms_policy.arn
}
