resource "aws_lb" "main" {
  count = local.enable_full_stack ? 1 : 0

  name               = "${local.prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = aws_subnet.public[*].id

  tags = { Name = "${local.prefix}-alb" }
}

resource "aws_lb_target_group" "api" {
  count = local.enable_full_stack ? 1 : 0

  name        = "${local.prefix}-api-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main[0].id
  target_type = "ip"

  health_check {
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = { Name = "${local.prefix}-api-tg" }
}

# HTTP listener — redirect to HTTPS if certificate exists, otherwise serve directly
resource "aws_lb_listener" "http" {
  count             = local.enable_full_stack ? 1 : 0
  load_balancer_arn = aws_lb.main[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = var.alb_certificate_arn != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.alb_certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    target_group_arn = var.alb_certificate_arn == "" ? aws_lb_target_group.api[0].arn : null
  }
}

# HTTPS listener — only when certificate is provided
resource "aws_lb_listener" "https" {
  count = local.enable_full_stack && var.alb_certificate_arn != "" ? 1 : 0

  load_balancer_arn = aws_lb.main[0].arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.alb_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api[0].arn
  }
}
