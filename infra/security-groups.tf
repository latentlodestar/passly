################################################################################
# ALB Security Group
################################################################################

resource "aws_security_group" "alb" {
  count = local.enable_full_stack ? 1 : 0

  name_prefix = "${local.prefix}-alb-"
  description = "ALB security group"
  vpc_id      = aws_vpc.main[0].id

  tags = { Name = "${local.prefix}-alb-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  count             = local.enable_full_stack ? 1 : 0
  security_group_id = aws_security_group.alb[0].id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  count             = local.enable_full_stack ? 1 : 0
  security_group_id = aws_security_group.alb[0].id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_ecs" {
  count                        = local.enable_full_stack ? 1 : 0
  security_group_id            = aws_security_group.alb[0].id
  referenced_security_group_id = aws_security_group.ecs_api[0].id
  from_port                    = 8080
  to_port                      = 8080
  ip_protocol                  = "tcp"
}

################################################################################
# ECS API Security Group
################################################################################

resource "aws_security_group" "ecs_api" {
  count = local.enable_full_stack ? 1 : 0

  name_prefix = "${local.prefix}-ecs-api-"
  description = "ECS API tasks security group"
  vpc_id      = aws_vpc.main[0].id

  tags = { Name = "${local.prefix}-ecs-api-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "ecs_api_from_alb" {
  count                        = local.enable_full_stack ? 1 : 0
  security_group_id            = aws_security_group.ecs_api[0].id
  referenced_security_group_id = aws_security_group.alb[0].id
  from_port                    = 8080
  to_port                      = 8080
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "ecs_api_all" {
  count             = local.enable_full_stack ? 1 : 0
  security_group_id = aws_security_group.ecs_api[0].id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

################################################################################
# ECS Worker Security Group
################################################################################

resource "aws_security_group" "ecs_worker" {
  count = local.enable_full_stack ? 1 : 0

  name_prefix = "${local.prefix}-ecs-worker-"
  description = "ECS Worker tasks security group"
  vpc_id      = aws_vpc.main[0].id

  tags = { Name = "${local.prefix}-ecs-worker-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_egress_rule" "ecs_worker_all" {
  count             = local.enable_full_stack ? 1 : 0
  security_group_id = aws_security_group.ecs_worker[0].id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

################################################################################
# Aurora Security Group
################################################################################

resource "aws_security_group" "aurora" {
  count = local.enable_full_stack ? 1 : 0

  name_prefix = "${local.prefix}-aurora-"
  description = "Aurora security group"
  vpc_id      = aws_vpc.main[0].id

  tags = { Name = "${local.prefix}-aurora-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "aurora_from_api" {
  count                        = local.enable_full_stack ? 1 : 0
  security_group_id            = aws_security_group.aurora[0].id
  referenced_security_group_id = aws_security_group.ecs_api[0].id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "aurora_from_worker" {
  count                        = local.enable_full_stack ? 1 : 0
  security_group_id            = aws_security_group.aurora[0].id
  referenced_security_group_id = aws_security_group.ecs_worker[0].id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}
