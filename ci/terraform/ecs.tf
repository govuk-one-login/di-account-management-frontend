
resource "aws_ecs_service" "account_management_ecs_service" {
  count           = var.environment == "sandpit" ? 1 : 0
  name            = "${var.environment}-account-management-ecs-service"
  cluster         = var.account_management_ecs_cluster_id
  task_definition = aws_ecs_task_definition.account_management_task_definition[0].arn
  desired_count   = var.account_management_ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = concat(var.account_management_ecs_security_groups, [aws_security_group.account_management_ecs_tasks_sg[0].id])
    subnets          = var.account_management_ecs_subnets
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.account_management_alb_target_group[0].arn
    container_name   = "${var.environment}-account-management-ecs-task-definition-container"
    container_port   = var.account_management_app_port
  }

}

resource "aws_ecs_task_definition" "account_management_task_definition" {
  count                    = var.environment == "sandpit" ? 1 : 0
  family                   = "${var.environment}-account-management-ecs-task-definition"
  execution_role_arn       = aws_iam_role.account_management_ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.account_management_ecs_task_role.arn
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024
  memory                   = 2048
  container_definitions = jsonencode([
    {
      name      = "${var.environment}-account-management-ecs-task-definition-container"
      image     = "${var.account_management_image_uri}"
      essential = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "${var.environment}-account-management-ecs-log-group"
          awslogs-region        = "${var.aws_region}"
          awslogs-stream-prefix = "${var.environment}-account-management-ecs-log-stream"
        }
      }
      portMappings = [
        {
          protocol      = "tcp"
          containerPort = var.account_management_app_port
          hostPort      = var.account_management_app_port
      }]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "APP_ENV"
          value = "${var.app_env}"
        },
        {
          name  = "FARGATE"
          value = "${var.fargate}"
        },
        {
          name  = "API_BASE_URL"
          value = "${var.api_base_url}"
        },
        {
          name  = "AM_API_BASE_URL"
          value = "${var.am_api_base_url}"
        },
        {
          name  = "BASE_URL"
          value = aws_route53_record.account_management_fg.name
        },
        {
          name  = "OIDC_CLIENT_ID"
          value = "${var.oidc_client_id}"
        },
        {
          name  = "OIDC_CLIENT_SCOPES"
          value = "${var.oidc_client_scopes}"
        },
        {
          name  = "SESSION_EXPIRY"
          value = "${var.session_expiry}"
        },
        {
          name  = "SESSION_SECRET"
          value = "${var.session_secret}"
        },
        {
          name  = "AM_YOUR_ACCOUNT_URL"
          value = "${var.your_account_url}"
        },
        {
          name  = "GTM_ID"
          value = "${var.gtm_id}"
        },
        {
          name  = "GOV_ACCOUNTS_PUBLISHING_API_URL"
          value = "${var.gov_accounts_publishing_api_url}"
        },
        {
          name  = "GOV_ACCOUNTS_PUBLISHING_API_TOKEN"
          value = "${var.gov_account_publishing_api_token}"
        },
        {
          name  = "AUTH_FRONTEND_URL"
          value = "${var.auth_frontend_url}"
        },
        {
          name  = "ANALYTICS_COOKIE_DOMAIN"
          value = "${var.analytics_cookie_domain}"
        },
        {
          name  = "COOKIES_AND_FEEDBACK_URL"
          value = "${var.cookies_and_feedback_url}"
        },
        {
          name  = "REDIS_HOST"
          value = "${var.redis_host}"
        },
        {
          name  = "REDIS_KEY"
          value = "${var.redis_key}"
        },
        {
          name  = "KMS_KEY_ID"
          value = "${var.kms_key_id}"
        },
      ]
  }])
}

resource "aws_cloudwatch_log_group" "account_management-ecs-log-group" {
  name = "${var.environment}-account-management-ecs-log-group"

  retention_in_days = 1
}