
data "aws_iam_policy_document" "account_management_ecs_task_execution_policy_document" {
  statement {
    sid    = ""
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "account_management_ecs_task_execution_role" {
  name               = "${var.environment}-account-management-ecs-task-execution-role"
  assume_role_policy = data.aws_iam_policy_document.account_management_ecs_task_execution_policy_document.json
}

resource "aws_iam_role_policy_attachment" "account_management_ecs_task_execution_role_policy_attachment" {
  role       = aws_iam_role.account_management_ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "account_management_ecs_task_execution_role_ssm_policy_attachment" {
  role       = aws_iam_role.account_management_ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
}


data "aws_iam_policy_document" "account_management_ecs_task_policy_document" {
  statement {
    sid    = ""
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "kms_signing_policy_document" {
  statement {
    sid    = "AllowAccessToKmsSigningKey"
    effect = "Allow"

    actions = [
      "kms:Sign",
      "kms:GetPublicKey",
    ]

    resources = [
      "arn:aws:kms:eu-west-2:*:key/${var.kms_key_id}",
    ]
  }
}

resource "aws_iam_policy" "account_management_kms_signing_policy" {
  name        = "${var.environment}-account-management-kms-signing-policy"
  path        = "/"
  description = "IAM policy for managing KMS connection for account management which allows signing"

  policy = data.aws_iam_policy_document.kms_signing_policy_document.json
}

resource "aws_iam_role" "account_management_ecs_task_role" {
  name               = "${var.environment}-account-management-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.account_management_ecs_task_policy_document.json
}

resource "aws_iam_role_policy_attachment" "account_management_ecs_task_role_ssm_policy_attachment" {
  role       = aws_iam_role.account_management_ecs_task_role.name
  policy_arn = aws_iam_policy.parameter_policy.arn
}

resource "aws_iam_role_policy_attachment" "account_management_ecs_task_role_kms_policy_attachment" {
  role       = aws_iam_role.account_management_ecs_task_role.name
  policy_arn = aws_iam_policy.account_management_kms_signing_policy.arn
}
