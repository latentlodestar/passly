environment = "staging"
aws_region  = "us-east-1"

# ECS sizing
api_desired_count    = 1
worker_desired_count = 1
api_cpu              = 512
api_memory           = 1024
worker_cpu           = 1024
worker_memory        = 2048

# Auto-shutdown (scale to 0 outside work hours)
enable_auto_shutdown = true

# Aurora Serverless v2
aurora_min_capacity = 0.5
aurora_max_capacity = 2
