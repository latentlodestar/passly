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
  count              = local.enable_full_stack ? 1 : 0
  name               = "${local.prefix}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "ecs_execution" {
  count = local.enable_full_stack ? 1 : 0

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
    resources = ["${aws_cloudwatch_log_group.api[0].arn}:*", "${aws_cloudwatch_log_group.worker[0].arn}:*", "${aws_cloudwatch_log_group.migration_runner[0].arn}:*"]
  }

  statement {
    sid       = "Secrets"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_rds_cluster.main[0].master_user_secret[0].secret_arn]
  }
}

resource "aws_iam_role_policy" "ecs_execution" {
  count  = local.enable_full_stack ? 1 : 0
  name   = "${local.prefix}-ecs-execution"
  role   = aws_iam_role.ecs_execution[0].id
  policy = data.aws_iam_policy_document.ecs_execution[0].json
}

################################################################################
# API Task Role
################################################################################

resource "aws_iam_role" "api_task" {
  count              = local.enable_full_stack ? 1 : 0
  name               = "${local.prefix}-api-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "api_task" {
  count = local.enable_full_stack ? 1 : 0

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
  count  = local.enable_full_stack ? 1 : 0
  name   = "${local.prefix}-api-task"
  role   = aws_iam_role.api_task[0].id
  policy = data.aws_iam_policy_document.api_task[0].json
}

################################################################################
# Worker Task Role
################################################################################

resource "aws_iam_role" "worker_task" {
  count              = local.enable_full_stack ? 1 : 0
  name               = "${local.prefix}-worker-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "worker_task" {
  count = local.enable_full_stack ? 1 : 0

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
  count  = local.enable_full_stack ? 1 : 0
  name   = "${local.prefix}-worker-task"
  role   = aws_iam_role.worker_task[0].id
  policy = data.aws_iam_policy_document.worker_task[0].json
}

################################################################################
# MigrationRunner Task Role (no AWS service permissions needed)
################################################################################

resource "aws_iam_role" "migration_runner_task" {
  count              = local.enable_full_stack ? 1 : 0
  name               = "${local.prefix}-migration-runner-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

################################################################################
# Dev Hybrid App Role (local + AWS)
################################################################################

data "aws_iam_policy_document" "dev_app_assume" {
  count = local.enable_dev_minimal ? 1 : 0

  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "AWS"
      identifiers = [var.dev_app_principal_arn]
    }
  }
}

resource "aws_iam_role" "dev_app" {
  count              = local.enable_dev_minimal ? 1 : 0
  name               = "${local.prefix}-app"
  assume_role_policy = data.aws_iam_policy_document.dev_app_assume[0].json

  lifecycle {
    precondition {
      condition     = var.dev_app_principal_arn != ""
      error_message = "dev_app_principal_arn must be set when environment is dev."
    }
  }
}

data "aws_iam_policy_document" "dev_app" {
  count = local.enable_dev_minimal ? 1 : 0

  statement {
    sid = "CognitoUserPoolAdmin"
    actions = [
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminDeleteUser",
      "cognito-idp:AdminDisableUser",
      "cognito-idp:AdminEnableUser",
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminInitiateAuth",
      "cognito-idp:AdminRespondToAuthChallenge",
      "cognito-idp:AdminResetUserPassword",
      "cognito-idp:AdminSetUserMFAPreference",
      "cognito-idp:AdminSetUserPassword",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminUserGlobalSignOut",
      "cognito-idp:ListUsers",
      "cognito-idp:SetUserMFAPreference",
    ]
    resources = [aws_cognito_user_pool.main.arn]
  }

  statement {
    sid = "SQSImports"
    actions = [
      "sqs:SendMessage",
      "sqs:GetQueueUrl",
      "sqs:GetQueueAttributes",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:ChangeMessageVisibility",
    ]
    resources = [
      aws_sqs_queue.imports.arn,
      aws_sqs_queue.imports_dlq.arn,
    ]
  }
}

resource "aws_iam_role_policy" "dev_app" {
  count  = local.enable_dev_minimal ? 1 : 0
  name   = "${local.prefix}-app"
  role   = aws_iam_role.dev_app[0].id
  policy = data.aws_iam_policy_document.dev_app[0].json
}

################################################################################
# GitHub Actions OIDC
################################################################################

data "aws_iam_openid_connect_provider" "github" {
  count = local.enable_full_stack ? 1 : 0
  url = "https://token.actions.githubusercontent.com"
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "github_actions_assume" {
  count = local.enable_full_stack ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github[0].arn]
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
  count              = local.enable_full_stack ? 1 : 0
  name               = "${local.prefix}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume[0].json
}

data "aws_iam_policy_document" "github_actions" {
  count = local.enable_full_stack ? 1 : 0

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
      aws_iam_role.ecs_execution[0].arn,
      aws_iam_role.api_task[0].arn,
      aws_iam_role.worker_task[0].arn,
      aws_iam_role.migration_runner_task[0].arn,
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
      aws_s3_bucket.web[0].arn,
      "${aws_s3_bucket.web[0].arn}/*",
    ]
  }

  statement {
    sid       = "CloudFront"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.main[0].arn]
  }
}

resource "aws_iam_role_policy" "github_actions" {
  count  = local.enable_full_stack ? 1 : 0
  name   = "${local.prefix}-github-actions"
  role   = aws_iam_role.github_actions[0].id
  policy = data.aws_iam_policy_document.github_actions[0].json
}
