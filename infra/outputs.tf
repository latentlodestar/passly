output "alb_dns_name" {
  description = "ALB DNS name"
  value       = local.enable_full_stack ? aws_lb.main[0].dns_name : null
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = local.enable_full_stack ? aws_cloudfront_distribution.main[0].domain_name : null
}

output "ecr_api_url" {
  description = "ECR repository URL for API"
  value       = local.enable_full_stack ? aws_ecr_repository.api[0].repository_url : null
}

output "ecr_worker_url" {
  description = "ECR repository URL for Worker"
  value       = local.enable_full_stack ? aws_ecr_repository.worker[0].repository_url : null
}

output "ecr_migration_runner_url" {
  description = "ECR repository URL for MigrationRunner"
  value       = local.enable_full_stack ? aws_ecr_repository.migration_runner[0].repository_url : null
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = local.enable_full_stack ? aws_ecs_cluster.main[0].name : null
}

output "api_service_name" {
  description = "API ECS service name"
  value       = local.enable_full_stack ? aws_ecs_service.api[0].name : null
}

output "worker_service_name" {
  description = "Worker ECS service name"
  value       = local.enable_full_stack ? aws_ecs_service.worker[0].name : null
}

output "migration_runner_task_definition" {
  description = "MigrationRunner task definition ARN"
  value       = local.enable_full_stack ? aws_ecs_task_definition.migration_runner[0].arn : null
}

output "web_bucket_name" {
  description = "S3 bucket for frontend assets"
  value       = local.enable_full_stack ? aws_s3_bucket.web[0].id : null
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = local.enable_full_stack ? aws_cloudfront_distribution.main[0].id : null
}

output "sqs_queue_url" {
  description = "SQS imports queue URL"
  value       = aws_sqs_queue.imports.url
}

output "public_subnet_ids" {
  description = "Public subnet IDs (for GitHub Actions vars)"
  value       = local.enable_full_stack ? aws_subnet.public[*].id : []
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_mobile_client_id" {
  description = "Cognito Mobile User Pool Client ID"
  value       = aws_cognito_user_pool_client.mobile.id
}

output "cognito_issuer_url" {
  description = "Cognito issuer URL for JWT validation"
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "dev_app_role_arn" {
  description = "Dev hybrid app role ARN (local assume-role)"
  value       = local.enable_dev_minimal ? aws_iam_role.dev_app[0].arn : null
}
