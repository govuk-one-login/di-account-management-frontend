#!/usr/bin/env bash

set -e

TF_COMMAND="apply -auto-approve"
#TF_COMMAND="plan"

# Redis SSM
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_policy_document.key_policy"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_kms_key.parameter_store_key"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_kms_alias.parameter_store_key_alias"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="random_password.redis_password"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_ssm_parameter.redis_master_host"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_ssm_parameter.redis_replica_host"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_ssm_parameter.redis_tls"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_ssm_parameter.redis_password"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_ssm_parameter.redis_port"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_policy_document.redis_parameter_policy"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_policy.parameter_policy"

# ALB
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_security_group.account_management_ecs_tasks_sg"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_security_group.account_management_alb_sg"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_alb_target_group.account_management_alb_target_group"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_alb_listener.account_management_alb_listener_http"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_alb_listener.account_management_alb_listener_https"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_lb.account_management_alb"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_cloudwatch_log_group.account_management-ecs-log-group"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_security_group.account_management_alb_sg"

# AM KMS
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_policy_document.kms_signing_policy_document"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_policy.account_management_kms_signing_policy"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_role.account_management_ecs_kms_role"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_role_policy_attachment.account_management_ecs_task_role_kms_policy_attachment"

# ECS
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_security_group.account_management_ecs_tasks_sg"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_role.account_management_ecs_task_execution_role"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_role_policy_attachment.account_management_ecs_task_execution_role_policy_attachment"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_role.account_management_ecs_task_role"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_iam_role_policy_attachment.account_management_ecs_task_role_ssm_policy_attachment"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_ecs_task_definition.account_management_task_definition"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_ecs_service.account_management_ecs_service"

# DNS
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_route53_record.account_management_fg" -target="aws_acm_certificate.account_management_fg_certificate"
terraform $TF_COMMAND -var-file=sandpit.tfvars -target="aws_route53_record.account_management_fg_certificate_validation" -target="aws_acm_certificate_validation.account_management_fg_acm_certificate_validation"
