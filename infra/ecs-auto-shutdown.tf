# Scheduled auto-scaling to shut down ECS services outside work hours.
# Scales API + worker to 0 in the evening, back up on weekday mornings.
# Weekend: stays at 0 from Friday evening to Monday morning.

# --- API ---

resource "aws_appautoscaling_target" "api" {
  count = local.enable_full_stack && var.enable_auto_shutdown ? 1 : 0

  max_capacity       = var.api_desired_count
  min_capacity       = 0
  resource_id        = "service/${aws_ecs_cluster.main[0].name}/${aws_ecs_service.api[0].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_scheduled_action" "api_scale_up" {
  count = local.enable_full_stack && var.enable_auto_shutdown ? 1 : 0

  name               = "${local.prefix}-api-scale-up"
  service_namespace  = aws_appautoscaling_target.api[0].service_namespace
  resource_id        = aws_appautoscaling_target.api[0].resource_id
  scalable_dimension = aws_appautoscaling_target.api[0].scalable_dimension
  schedule           = var.auto_shutdown_scale_up_cron
  timezone           = var.auto_shutdown_timezone

  scalable_target_action {
    min_capacity = var.api_desired_count
    max_capacity = var.api_desired_count
  }
}

resource "aws_appautoscaling_scheduled_action" "api_scale_down" {
  count = local.enable_full_stack && var.enable_auto_shutdown ? 1 : 0

  name               = "${local.prefix}-api-scale-down"
  service_namespace  = aws_appautoscaling_target.api[0].service_namespace
  resource_id        = aws_appautoscaling_target.api[0].resource_id
  scalable_dimension = aws_appautoscaling_target.api[0].scalable_dimension
  schedule           = var.auto_shutdown_scale_down_cron
  timezone           = var.auto_shutdown_timezone

  scalable_target_action {
    min_capacity = 0
    max_capacity = 0
  }
}

# --- Worker ---

resource "aws_appautoscaling_target" "worker" {
  count = local.enable_full_stack && var.enable_auto_shutdown ? 1 : 0

  max_capacity       = var.worker_desired_count
  min_capacity       = 0
  resource_id        = "service/${aws_ecs_cluster.main[0].name}/${aws_ecs_service.worker[0].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_scheduled_action" "worker_scale_up" {
  count = local.enable_full_stack && var.enable_auto_shutdown ? 1 : 0

  name               = "${local.prefix}-worker-scale-up"
  service_namespace  = aws_appautoscaling_target.worker[0].service_namespace
  resource_id        = aws_appautoscaling_target.worker[0].resource_id
  scalable_dimension = aws_appautoscaling_target.worker[0].scalable_dimension
  schedule           = var.auto_shutdown_scale_up_cron
  timezone           = var.auto_shutdown_timezone

  scalable_target_action {
    min_capacity = var.worker_desired_count
    max_capacity = var.worker_desired_count
  }
}

resource "aws_appautoscaling_scheduled_action" "worker_scale_down" {
  count = local.enable_full_stack && var.enable_auto_shutdown ? 1 : 0

  name               = "${local.prefix}-worker-scale-down"
  service_namespace  = aws_appautoscaling_target.worker[0].service_namespace
  resource_id        = aws_appautoscaling_target.worker[0].resource_id
  scalable_dimension = aws_appautoscaling_target.worker[0].scalable_dimension
  schedule           = var.auto_shutdown_scale_down_cron
  timezone           = var.auto_shutdown_timezone

  scalable_target_action {
    min_capacity = 0
    max_capacity = 0
  }
}
