environment = "prod"
aws_region  = "us-east-1"

# ECS sizing
api_desired_count    = 2
worker_desired_count = 1
api_cpu              = 512
api_memory           = 1024
worker_cpu           = 1024
worker_memory        = 2048

# Aurora Serverless v2
aurora_min_capacity = 0.5
aurora_max_capacity = 8

# Domain — uncomment and set when DNS is configured
# domain_name         = "app.passly.io"
# acm_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID"
# alb_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID"
