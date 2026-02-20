resource "aws_ecs_task_definition" "worker" {
  count                    = local.enable_full_stack ? 1 : 0
  family                   = "${local.prefix}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = aws_iam_role.ecs_execution[0].arn
  task_role_arn            = aws_iam_role.worker_task[0].arn

  container_definitions = jsonencode([{
    name      = "worker"
    image     = "${aws_ecr_repository.worker[0].repository_url}:latest"
    essential = true

    environment = [
      { name = "DOTNET_ENVIRONMENT", value = var.environment == "prod" ? "Production" : "Staging" },
      { name = "ConnectionStrings__passlydb", value = local.db_connection_string },
      { name = "Messaging__Region", value = var.aws_region },
      { name = "Messaging__QueueName", value = aws_sqs_queue.imports.name },
    ]

    secrets = [{
      name      = "DB_PASSWORD"
      valueFrom = "${local.db_secret_arn}:password::"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.worker[0].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "worker"
      }
    }
  }])

  tags = { Name = "${local.prefix}-worker-task" }
}

resource "aws_ecs_service" "worker" {
  count           = local.enable_full_stack ? 1 : 0
  name            = "${local.prefix}-worker"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.worker[0].arn
  desired_count   = var.worker_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_worker[0].id]
    assign_public_ip = true
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = { Name = "${local.prefix}-worker-service" }
}
