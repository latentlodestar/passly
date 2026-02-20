resource "aws_cloudwatch_log_group" "api" {
  count = local.enable_full_stack ? 1 : 0

  name              = "/ecs/${local.prefix}/api"
  retention_in_days = 30

  tags = { Name = "${local.prefix}-api-logs" }
}

resource "aws_cloudwatch_log_group" "worker" {
  count = local.enable_full_stack ? 1 : 0

  name              = "/ecs/${local.prefix}/worker"
  retention_in_days = 30

  tags = { Name = "${local.prefix}-worker-logs" }
}

resource "aws_cloudwatch_log_group" "migration_runner" {
  count = local.enable_full_stack ? 1 : 0

  name              = "/ecs/${local.prefix}/migration-runner"
  retention_in_days = 14

  tags = { Name = "${local.prefix}-migration-runner-logs" }
}

resource "aws_cloudwatch_dashboard" "health" {
  count          = local.enable_full_stack ? 1 : 0
  dashboard_name = "${local.prefix}-health"

  dashboard_body = jsonencode({
    widgets = [
      # ── Row 1: HTTP Health ──
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 6
        height = 6
        properties = {
          title  = "Request Count"
          region = var.aws_region
          stat   = "Sum"
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main[0].arn_suffix]
          ]
        }
      },
      {
        type   = "metric"
        x      = 6
        y      = 0
        width  = 6
        height = 6
        properties = {
          title  = "HTTP 2xx / 4xx / 5xx"
          region = var.aws_region
          stat   = "Sum"
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "TargetGroup", aws_lb_target_group.api[0].arn_suffix, "LoadBalancer", aws_lb.main[0].arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "TargetGroup", aws_lb_target_group.api[0].arn_suffix, "LoadBalancer", aws_lb.main[0].arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "TargetGroup", aws_lb_target_group.api[0].arn_suffix, "LoadBalancer", aws_lb.main[0].arn_suffix]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 6
        height = 6
        properties = {
          title  = "Target Response Time"
          region = var.aws_region
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "TargetGroup", aws_lb_target_group.api[0].arn_suffix, "LoadBalancer", aws_lb.main[0].arn_suffix, { stat = "Average" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "TargetGroup", aws_lb_target_group.api[0].arn_suffix, "LoadBalancer", aws_lb.main[0].arn_suffix, { stat = "p99" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 18
        y      = 0
        width  = 6
        height = 6
        properties = {
          title  = "Healthy / Unhealthy Hosts"
          region = var.aws_region
          stat   = "Average"
          period = 60
          metrics = [
            ["AWS/ApplicationELB", "HealthyHostCount", "TargetGroup", aws_lb_target_group.api[0].arn_suffix, "LoadBalancer", aws_lb.main[0].arn_suffix],
            ["AWS/ApplicationELB", "UnHealthyHostCount", "TargetGroup", aws_lb_target_group.api[0].arn_suffix, "LoadBalancer", aws_lb.main[0].arn_suffix]
          ]
        }
      },

      # ── Row 2: Aurora Database Health ──
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 5
        height = 6
        properties = {
          title  = "CPU Utilization"
          region = var.aws_region
          stat   = "Average"
          period = 60
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_rds_cluster_instance.main[0].identifier]
          ]
        }
      },
      {
        type   = "metric"
        x      = 5
        y      = 6
        width  = 5
        height = 6
        properties = {
          title  = "DB Connections"
          region = var.aws_region
          stat   = "Average"
          period = 60
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_rds_cluster_instance.main[0].identifier]
          ]
        }
      },
      {
        type   = "metric"
        x      = 10
        y      = 6
        width  = 4
        height = 6
        properties = {
          title  = "ACU Usage"
          region = var.aws_region
          stat   = "Average"
          period = 60
          metrics = [
            ["AWS/RDS", "ServerlessDatabaseCapacity", "DBClusterIdentifier", aws_rds_cluster.main[0].cluster_identifier]
          ]
        }
      },
      {
        type   = "metric"
        x      = 14
        y      = 6
        width  = 5
        height = 6
        properties = {
          title  = "Commit + Read Latency"
          region = var.aws_region
          stat   = "Average"
          period = 60
          metrics = [
            ["AWS/RDS", "CommitLatency", "DBClusterIdentifier", aws_rds_cluster.main[0].cluster_identifier],
            ["AWS/RDS", "SelectLatency", "DBClusterIdentifier", aws_rds_cluster.main[0].cluster_identifier]
          ]
        }
      },
      {
        type   = "metric"
        x      = 19
        y      = 6
        width  = 5
        height = 6
        properties = {
          title  = "Read / Write IOPS"
          region = var.aws_region
          stat   = "Average"
          period = 60
          metrics = [
            ["AWS/RDS", "ReadIOPS", "DBInstanceIdentifier", aws_rds_cluster_instance.main[0].identifier],
            ["AWS/RDS", "WriteIOPS", "DBInstanceIdentifier", aws_rds_cluster_instance.main[0].identifier]
          ]
        }
      },

      # ── Row 3: SQS Health ──
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 6
        height = 6
        properties = {
          title  = "Queue Depth"
          region = var.aws_region
          stat   = "Average"
          period = 60
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.imports.name]
          ]
        }
      },
      {
        type   = "metric"
        x      = 6
        y      = 12
        width  = 6
        height = 6
        properties = {
          title  = "In Flight"
          region = var.aws_region
          stat   = "Average"
          period = 60
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesNotVisible", "QueueName", aws_sqs_queue.imports.name]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 6
        height = 6
        properties = {
          title  = "Oldest Message Age"
          region = var.aws_region
          stat   = "Maximum"
          period = 60
          metrics = [
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", aws_sqs_queue.imports.name]
          ]
        }
      },
      {
        type   = "metric"
        x      = 18
        y      = 12
        width  = 6
        height = 6
        properties = {
          title  = "DLQ Depth"
          region = var.aws_region
          stat   = "Sum"
          period = 60
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.imports_dlq.name]
          ]
        }
      }
    ]
  })
}
