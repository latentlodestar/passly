################################################################################
# ECS Execution Role (shared — pull images, write logs, read secrets)
################################################################################

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "${local.prefix}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "ecs_execution" {
  statement {
    sid = "ECR"
    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  statement {
    sid = "Logs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["${aws_cloudwatch_log_group.api.arn}:*", "${aws_cloudwatch_log_group.worker.arn}:*", "${aws_cloudwatch_log_group.migration_runner.arn}:*"]
  }

  statement {
    sid       = "Secrets"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_rds_cluster.main.master_user_secret[0].secret_arn]
  }
}

resource "aws_iam_role_policy" "ecs_execution" {
  name   = "${local.prefix}-ecs-execution"
  role   = aws_iam_role.ecs_execution.id
  policy = data.aws_iam_policy_document.ecs_execution.json
}

################################################################################
# API Task Role
################################################################################

resource "aws_iam_role" "api_task" {
  name               = "${local.prefix}-api-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "api_task" {
  statement {
    sid = "SQSSend"
    actions = [
      "sqs:SendMessage",
      "sqs:GetQueueUrl",
      "sqs:GetQueueAttributes",
    ]
    resources = [aws_sqs_queue.imports.arn]
  }
}

resource "aws_iam_role_policy" "api_task" {
  name   = "${local.prefix}-api-task"
  role   = aws_iam_role.api_task.id
  policy = data.aws_iam_policy_document.api_task.json
}

################################################################################
# Worker Task Role
################################################################################

resource "aws_iam_role" "worker_task" {
  name               = "${local.prefix}-worker-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "worker_task" {
  statement {
    sid = "SQSConsume"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:ChangeMessageVisibility",
      "sqs:SendMessage",
      "sqs:GetQueueUrl",
      "sqs:GetQueueAttributes",
    ]
    resources = [
      aws_sqs_queue.imports.arn,
      aws_sqs_queue.imports_dlq.arn,
    ]
  }

  statement {
    sid = "SQSRebusInternal"
    actions = [
      "sqs:CreateQueue",
      "sqs:SetQueueAttributes",
      "sqs:ListQueues",
      "sqs:GetQueueUrl",
      "sqs:GetQueueAttributes",
    ]
    resources = ["arn:aws:sqs:${var.aws_region}:*:${local.prefix}-*"]
  }
}

resource "aws_iam_role_policy" "worker_task" {
  name   = "${local.prefix}-worker-task"
  role   = aws_iam_role.worker_task.id
  policy = data.aws_iam_policy_document.worker_task.json
}

################################################################################
# MigrationRunner Task Role (no AWS service permissions needed)
################################################################################

resource "aws_iam_role" "migration_runner_task" {
  name               = "${local.prefix}-migration-runner-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

################################################################################
# GitHub Actions OIDC
################################################################################

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:*:*"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${local.prefix}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
}

data "aws_iam_policy_document" "github_actions" {
  statement {
    sid = "ECR"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = ["*"]
  }

  statement {
    sid = "ECS"
    actions = [
      "ecs:UpdateService",
      "ecs:DescribeServices",
      "ecs:DescribeTaskDefinition",
      "ecs:RegisterTaskDefinition",
      "ecs:RunTask",
      "ecs:DescribeTasks",
      "ecs:ListTasks",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "PassRole"
    actions   = ["iam:PassRole"]
    resources = [
      aws_iam_role.ecs_execution.arn,
      aws_iam_role.api_task.arn,
      aws_iam_role.worker_task.arn,
      aws_iam_role.migration_runner_task.arn,
    ]
  }

  statement {
    sid = "S3Web"
    actions = [
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.web.arn,
      "${aws_s3_bucket.web.arn}/*",
    ]
  }

  statement {
    sid       = "CloudFront"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.main.arn]
  }
}

resource "aws_iam_role_policy" "github_actions" {
  name   = "${local.prefix}-github-actions"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.github_actions.json
}
