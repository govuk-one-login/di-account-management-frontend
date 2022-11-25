resource "aws_security_group" "am_frontend_redis_security_group" {
  name_prefix = "${var.environment}-am-frontend-redis-security-group-"
  description = "Allow ingress to AM frontend Redis. Use on Elasticache cluster only"
  vpc_id      = local.vpc_id

  lifecycle {
    create_before_destroy = true
  }

  tags = local.default_tags
}

resource "aws_security_group_rule" "allow_incoming_am_frontend_redis_from_private_subnet" {
  security_group_id = aws_security_group.am_frontend_redis_security_group.id

  from_port   = local.redis_port_number
  protocol    = "tcp"
  cidr_blocks = local.private_subnet_cidr_blocks
  to_port     = local.redis_port_number
  type        = "ingress"
}

resource "aws_security_group" "allow_access_to_am_frontend_redis" {
  name_prefix = "${var.environment}-allow-access-to-acct-mgmt-frontend-redis-"
  description = "Allow outgoing access to the Account Management frontend Redis session store"
  vpc_id      = local.vpc_id

  lifecycle {
    create_before_destroy = true
  }

  tags = local.default_tags
}

resource "aws_security_group_rule" "allow_connection_to_am_frontend_redis" {
  security_group_id = aws_security_group.allow_access_to_am_frontend_redis.id

  from_port                = local.redis_port_number
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.am_frontend_redis_security_group.id
  to_port                  = local.redis_port_number
  type                     = "egress"
}

resource "aws_security_group" "account_management_alb_sg" {
  name_prefix = "${var.environment}-account-management-alb-"
  vpc_id      = local.vpc_id

  lifecycle {
    create_before_destroy = true
  }

  tags = local.default_tags
}

resource "aws_security_group_rule" "allow_alb_http_ingress_from_anywhere" {
  security_group_id = aws_security_group.account_management_alb_sg.id
  type              = "ingress"

  description = "http"
  protocol    = "tcp"
  from_port   = 80
  to_port     = 80
  cidr_blocks = var.incoming_traffic_cidr_blocks
}

resource "aws_security_group_rule" "allow_alb_https_ingress_from_anywhere" {
  security_group_id = aws_security_group.account_management_alb_sg.id
  type              = "ingress"

  description = "https"
  protocol    = "tcp"
  from_port   = 443
  to_port     = 443
  cidr_blocks = var.incoming_traffic_cidr_blocks
}

resource "aws_security_group_rule" "allow_alb_application_egress_to_task_group" {
  security_group_id = aws_security_group.account_management_alb_sg.id
  type              = "egress"

  description              = "http"
  protocol                 = "tcp"
  from_port                = var.account_management_app_port
  to_port                  = var.account_management_app_port
  source_security_group_id = aws_security_group.account_management_ecs_tasks_sg.id
}

resource "aws_security_group" "account_management_ecs_tasks_sg" {
  name_prefix = "${var.environment}-account-management-ecs-task-"
  vpc_id      = local.vpc_id

  lifecycle {
    create_before_destroy = true
  }

  tags = local.default_tags
}

resource "aws_security_group_rule" "allow_ecs_task_ingress_from_alb" {
  security_group_id = aws_security_group.account_management_ecs_tasks_sg.id
  type              = "ingress"

  description              = "http"
  protocol                 = "tcp"
  from_port                = var.account_management_app_port
  to_port                  = var.account_management_app_port
  source_security_group_id = aws_security_group.account_management_alb_sg.id
}
