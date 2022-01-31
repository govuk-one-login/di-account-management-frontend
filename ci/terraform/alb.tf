resource "aws_lb" "account_management_alb" {
  name               = "${var.environment}-acct-mgmt"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.account_management_alb_sg.id]
  subnets            = local.public_subnet_ids

  enable_deletion_protection = false

  tags = local.default_tags
}

resource "aws_alb_target_group" "account_management_alb_target_group" {
  name        = "${var.environment}-acct-mgmt-target"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = local.vpc_id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = "3"
    path                = "/healthcheck"
    unhealthy_threshold = "2"
  }

  tags = local.default_tags
}

resource "aws_alb_listener" "account_management_alb_listener_https" {
  load_balancer_arn = aws_lb.account_management_alb.id
  port              = 443
  protocol          = "HTTPS"

  ssl_policy      = "ELBSecurityPolicy-2016-08"
  certificate_arn = aws_acm_certificate.account_management_fg_certificate.arn

  default_action {
    target_group_arn = aws_alb_target_group.account_management_alb_target_group.id
    type             = "forward"
  }

  depends_on = [
    aws_acm_certificate_validation.account_management_fg_acm_certificate_validation
  ]

  tags = local.default_tags
}
