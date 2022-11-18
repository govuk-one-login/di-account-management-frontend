data "aws_iam_policy_document" "lambda_can_assume_policy" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    principals {
      identifiers = [
        "lambda.amazonaws.com"
      ]
      type = "Service"
    }

    actions = [
      "sts:AssumeRole"
    ]
  }
}

resource "aws_iam_role" "redirect_lambda_iam_role" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  name_prefix = "execution-role-"
  path        = "/${var.environment}/redirect-lambda/"

  assume_role_policy = data.aws_iam_policy_document.lambda_can_assume_policy.json

  tags = local.default_tags
}

data "aws_iam_policy_document" "endpoint_logging_policy" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = [
      "arn:aws:logs:*:*:*",
    ]
  }
}

resource "aws_iam_policy" "endpoint_logging_policy" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  name_prefix = "logging-policy"
  path        = "/${var.environment}/redirect-lambda/"
  description = "IAM policy for logging from lambda"

  policy = data.aws_iam_policy_document.endpoint_logging_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  role       = aws_iam_role.redirect_lambda_iam_role[0].name
  policy_arn = aws_iam_policy.endpoint_logging_policy[0].arn
}

data "aws_iam_policy_document" "endpoint_xray_policy" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "xray:*"
    ]

    resources = [
      "*",
    ]
  }
}

resource "aws_iam_policy" "endpoint_xray_policy" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  name_prefix = "xray-policy"
  path        = "/${var.environment}/redirect-lambda/"
  description = "IAM policy for xray with a lambda"

  policy = data.aws_iam_policy_document.endpoint_xray_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_xray" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  role       = aws_iam_role.redirect_lambda_iam_role[0].name
  policy_arn = aws_iam_policy.endpoint_xray_policy[0].arn
}

data "aws_iam_policy_document" "endpoint_networking_policy" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "ec2:DescribeNetworkInterfaces",
      "ec2:CreateNetworkInterface",
      "ec2:DeleteNetworkInterface",
    ]
    resources = ["*"]
    condition {
      test     = "ArnLikeIfExists"
      variable = "ec2:Vpc"
      values   = [local.vpc_arn]
    }
  }
}

resource "aws_iam_policy" "endpoint_networking_policy" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  name_prefix = "networking-policy"
  path        = "/${var.environment}/redirect-lambda/"
  description = "IAM policy for managing VPC connection for a lambda"

  policy = data.aws_iam_policy_document.endpoint_networking_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_networking" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  role       = aws_iam_role.redirect_lambda_iam_role[0].name
  policy_arn = aws_iam_policy.endpoint_networking_policy[0].arn
}

resource "aws_lambda_function" "redirect_lambda" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  function_name = "${var.environment}-account-management-redirect"
  role          = aws_iam_role.redirect_lambda_iam_role[0].arn
  runtime       = "nodejs16.x"
  handler       = "redirect.handler"

  filename                = var.redirect_lambda_zip
  code_signing_config_arn = local.lambda_code_signing_configuration_arn

  vpc_config {
    security_group_ids = [local.allow_aws_service_access_security_group_id]
    subnet_ids         = local.private_subnet_ids
  }

  environment {
    variables = {
      REDIRECT_URL = var.account_management_redirect_url
    }
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  name              = "/aws/lambda/${aws_lambda_function.redirect_lambda[0].function_name}"
  tags              = local.default_tags
  kms_key_id        = aws_kms_key.cloudwatch_log_encryption.arn
  retention_in_days = var.cloudwatch_log_retention

  depends_on = [
    aws_lambda_function.redirect_lambda
  ]
}

resource "aws_cloudwatch_log_subscription_filter" "log_subscription" {
  count = var.account_management_redirect_url == "" ? 0 : length(var.logging_endpoint_arns)

  name            = "redirect-lambda-log-subscription-${count.index}"
  log_group_name  = aws_cloudwatch_log_group.lambda_log_group[0].name
  filter_pattern  = ""
  destination_arn = var.logging_endpoint_arns[count.index]

  lifecycle {
    create_before_destroy = false
  }
}

resource "aws_lambda_permission" "redirect_lambda" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  statement_id  = "AllowExecutionFromlb"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.redirect_lambda[0].function_name
  principal     = "elasticloadbalancing.amazonaws.com"
  source_arn    = aws_lb_target_group.redirect_lambda[0].arn
}

resource "aws_lb_target_group" "redirect_lambda" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  name        = "redirect-lambda"
  target_type = "lambda"

  tags = local.default_tags
}

resource "aws_lb_target_group_attachment" "test" {
  count = var.account_management_redirect_url == "" ? 0 : 1

  target_group_arn = aws_lb_target_group.redirect_lambda[0].arn
  target_id        = aws_lambda_function.redirect_lambda[0].arn
  depends_on       = [aws_lambda_permission.redirect_lambda]
}