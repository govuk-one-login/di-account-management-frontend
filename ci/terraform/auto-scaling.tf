
resource "aws_appautoscaling_target" "account_management_auto_scaling_target" {
  count              = var.account_management_auto_scaling_enabled ? 1 : 0
  min_capacity       = var.account_management_auto_scaling_min_count
  max_capacity       = var.account_management_auto_scaling_max_count
  resource_id        = "service/${var.environment}-app-cluster/${aws_ecs_service.account_management_ecs_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "account_management_auto_scaling_policy_memory" {
  count              = var.account_management_auto_scaling_enabled ? 1 : 0
  name               = "${var.environment}-account_management_auto_scaling_policy_memory"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.account_management_auto_scaling_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.account_management_auto_scaling_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.account_management_auto_scaling_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }

    target_value = var.account_management_auto_scaling_policy_memory_target
  }
}

resource "aws_appautoscaling_policy" "account_management_auto_scaling_policy_cpu" {
  count              = var.account_management_auto_scaling_enabled ? 1 : 0
  name               = "${var.environment}-account_management_auto_scaling_policy_cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.account_management_auto_scaling_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.account_management_auto_scaling_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.account_management_auto_scaling_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value = var.account_management_auto_scaling_policy_cpu_target
  }
}