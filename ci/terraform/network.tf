
resource "aws_security_group" "account_management_alb_sg" {
  name   = "${var.environment}-account-management-alb-security-group"
  vpc_id = var.account_management_vpc_id

  ingress {
    description = "http"
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "https"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol    = "tcp"
    from_port   = var.account_management_app_port
    to_port     = var.account_management_app_port
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "account_management_ecs_tasks_sg" {
  name   = "${var.environment}-account-management-ecs-tasks-security-group"
  vpc_id = var.account_management_vpc_id


  ingress {
    protocol        = "tcp"
    from_port       = var.account_management_app_port
    to_port         = var.account_management_app_port
    security_groups = [aws_security_group.account_management_alb_sg.id]
  }

  egress {
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }
}