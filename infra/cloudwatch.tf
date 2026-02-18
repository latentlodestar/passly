resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${local.prefix}/api"
  retention_in_days = 30

  tags = { Name = "${local.prefix}-api-logs" }
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${local.prefix}/worker"
  retention_in_days = 30

  tags = { Name = "${local.prefix}-worker-logs" }
}

resource "aws_cloudwatch_log_group" "migration_runner" {
  name              = "/ecs/${local.prefix}/migration-runner"
  retention_in_days = 14

  tags = { Name = "${local.prefix}-migration-runner-logs" }
}
