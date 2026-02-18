variable "environment" {
  description = "Deployment environment"
  type        = string

  validation {
    condition     = contains(["staging", "prod"], var.environment)
    error_message = "Environment must be 'staging' or 'prod'."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the application (e.g., app.passly.io). Leave empty to use CloudFront default domain."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for CloudFront (must be in us-east-1). Required if domain_name is set."
  type        = string
  default     = ""
}

variable "alb_certificate_arn" {
  description = "ACM certificate ARN for ALB HTTPS listener. Required if domain_name is set."
  type        = string
  default     = ""
}

variable "api_desired_count" {
  description = "Number of API ECS tasks"
  type        = number
  default     = 1
}

variable "worker_desired_count" {
  description = "Number of Worker ECS tasks"
  type        = number
  default     = 1
}

variable "api_cpu" {
  description = "API task CPU units (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "API task memory in MiB"
  type        = number
  default     = 1024
}

variable "worker_cpu" {
  description = "Worker task CPU units (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "worker_memory" {
  description = "Worker task memory in MiB"
  type        = number
  default     = 2048
}

variable "aurora_min_capacity" {
  description = "Aurora Serverless v2 minimum ACU"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Aurora Serverless v2 maximum ACU"
  type        = number
  default     = 2
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "passly"
}
