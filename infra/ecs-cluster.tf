resource "aws_ecs_cluster" "main" {
  count = local.enable_full_stack ? 1 : 0

  name = "${local.prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${local.prefix}-cluster" }
}
