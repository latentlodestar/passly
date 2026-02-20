resource "aws_ecs_task_definition" "api" {
  count                    = local.enable_full_stack ? 1 : 0
  family                   = "${local.prefix}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_execution[0].arn
  task_role_arn            = aws_iam_role.api_task[0].arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = "${aws_ecr_repository.api[0].repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = [
      { name = "ASPNETCORE_ENVIRONMENT", value = var.environment == "prod" ? "Production" : "Staging" },
      { name = "ConnectionStrings__passlydb", value = local.db_connection_string },
      { name = "Messaging__Transport", value = "sqs" },
      { name = "Messaging__Region", value = var.aws_region },
      { name = "Messaging__QueueName", value = aws_sqs_queue.imports.name },
      { name = "Auth__CognitoAuthority", value = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}" },
      { name = "Auth__CognitoClientId", value = aws_cognito_user_pool_client.main.id },
      { name = "Auth__CognitoClientIds", value = "${aws_cognito_user_pool_client.main.id},${aws_cognito_user_pool_client.mobile.id}" },
    ]

    secrets = [{
      name      = "DB_PASSWORD"
      valueFrom = "${local.db_secret_arn}:password::"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api[0].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "api"
      }
    }
  }])

  tags = { Name = "${local.prefix}-api-task" }
}

resource "aws_ecs_service" "api" {
  count           = local.enable_full_stack ? 1 : 0
  name            = "${local.prefix}-api"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.api[0].arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_api[0].id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api[0].arn
    container_name   = "api"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = { Name = "${local.prefix}-api-service" }
}
