output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "ecr_api_url" {
  description = "ECR repository URL for API"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_worker_url" {
  description = "ECR repository URL for Worker"
  value       = aws_ecr_repository.worker.repository_url
}

output "ecr_migration_runner_url" {
  description = "ECR repository URL for MigrationRunner"
  value       = aws_ecr_repository.migration_runner.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "api_service_name" {
  description = "API ECS service name"
  value       = aws_ecs_service.api.name
}

output "worker_service_name" {
  description = "Worker ECS service name"
  value       = aws_ecs_service.worker.name
}

output "migration_runner_task_definition" {
  description = "MigrationRunner task definition ARN"
  value       = aws_ecs_task_definition.migration_runner.arn
}

output "web_bucket_name" {
  description = "S3 bucket for frontend assets"
  value       = aws_s3_bucket.web.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "sqs_queue_url" {
  description = "SQS imports queue URL"
  value       = aws_sqs_queue.imports.url
}
