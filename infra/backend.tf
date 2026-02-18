terraform {
  backend "s3" {
    bucket         = "passly-terraform-state"
    region         = "us-east-1"
    dynamodb_table = "passly-terraform-locks"
    encrypt        = true
    # key is set per environment via -backend-config="key=staging/terraform.tfstate"
  }
}
