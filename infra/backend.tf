terraform {
  backend "s3" {
    bucket         = "latentlodestar-tf-state-409987738773"
    key            = "passly/dev/network/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
    profile        = "passly-org-admin"
    role_arn       = "arn:aws:iam::409987738773:role/TerraformStateAccessRole"
  }
}
