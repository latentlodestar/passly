resource "aws_ecr_repository" "api" {
  name                 = "${local.prefix}-api"
  image_tag_mutability = "IMMUTABLE"
  force_delete         = var.environment == "staging"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${local.prefix}-api" }
}

resource "aws_ecr_repository" "worker" {
  name                 = "${local.prefix}-worker"
  image_tag_mutability = "IMMUTABLE"
  force_delete         = var.environment == "staging"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${local.prefix}-worker" }
}

resource "aws_ecr_repository" "migration_runner" {
  name                 = "${local.prefix}-migration-runner"
  image_tag_mutability = "IMMUTABLE"
  force_delete         = var.environment == "staging"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${local.prefix}-migration-runner" }
}

locals {
  ecr_repos = {
    api              = aws_ecr_repository.api.name
    worker           = aws_ecr_repository.worker.name
    migration_runner = aws_ecr_repository.migration_runner.name
  }
}

resource "aws_ecr_lifecycle_policy" "keep_recent" {
  for_each   = local.ecr_repos
  repository = each.value

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
