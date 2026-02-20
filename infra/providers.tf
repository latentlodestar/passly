provider "aws" {
  region  = var.aws_region
  profile = "passly-dev-admin"

  default_tags {
    tags = local.common_tags
  }
}
