terraform {
  backend "s3" {
    bucket         = "latentlodestar-tf-state-409987738773"
    key            = "sandbox/network/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
