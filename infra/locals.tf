data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  enable_full_stack = var.environment != "dev"
  enable_dev_minimal = var.environment == "dev"
  prefix = "passly-${var.environment}"
  azs    = slice(data.aws_availability_zones.available.names, 0, 2)

  vpc_cidr         = "10.0.0.0/16"
  public_subnets   = ["10.0.1.0/24", "10.0.2.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24"]

  common_tags = {
    Project     = "passly"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
