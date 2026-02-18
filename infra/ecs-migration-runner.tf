resource "aws_ecs_task_definition" "migration_runner" {
  family                   = "${local.prefix}-migration-runner"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.migration_runner_task.arn

  container_definitions = jsonencode([{
    name      = "migration-runner"
    image     = "${aws_ecr_repository.migration_runner.repository_url}:latest"
    essential = true

    environment = [
      { name = "DOTNET_ENVIRONMENT", value = var.environment == "prod" ? "Production" : "Staging" },
      { name = "ConnectionStrings__passlydb", value = local.db_connection_string },
    ]

    secrets = [{
      name      = "DB_PASSWORD"
      valueFrom = "${local.db_secret_arn}:password::"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.migration_runner.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "migration"
      }
    }
  }])

  tags = { Name = "${local.prefix}-migration-runner-task" }
}
