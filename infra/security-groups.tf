################################################################################
# ALB Security Group
################################################################################

resource "aws_security_group" "alb" {
  name_prefix = "${local.prefix}-alb-"
  description = "ALB security group"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${local.prefix}-alb-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_ecs" {
  security_group_id            = aws_security_group.alb.id
  referenced_security_group_id = aws_security_group.ecs_api.id
  from_port                    = 8080
  to_port                      = 8080
  ip_protocol                  = "tcp"
}

################################################################################
# ECS API Security Group
################################################################################

resource "aws_security_group" "ecs_api" {
  name_prefix = "${local.prefix}-ecs-api-"
  description = "ECS API tasks security group"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${local.prefix}-ecs-api-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "ecs_api_from_alb" {
  security_group_id            = aws_security_group.ecs_api.id
  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 8080
  to_port                      = 8080
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "ecs_api_all" {
  security_group_id = aws_security_group.ecs_api.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

################################################################################
# ECS Worker Security Group
################################################################################

resource "aws_security_group" "ecs_worker" {
  name_prefix = "${local.prefix}-ecs-worker-"
  description = "ECS Worker tasks security group"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${local.prefix}-ecs-worker-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_egress_rule" "ecs_worker_all" {
  security_group_id = aws_security_group.ecs_worker.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

################################################################################
# Aurora Security Group
################################################################################

resource "aws_security_group" "aurora" {
  name_prefix = "${local.prefix}-aurora-"
  description = "Aurora security group"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${local.prefix}-aurora-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "aurora_from_api" {
  security_group_id            = aws_security_group.aurora.id
  referenced_security_group_id = aws_security_group.ecs_api.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "aurora_from_worker" {
  security_group_id            = aws_security_group.aurora.id
  referenced_security_group_id = aws_security_group.ecs_worker.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}
