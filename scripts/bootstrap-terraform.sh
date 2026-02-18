#!/usr/bin/env bash
set -euo pipefail

# Bootstrap Terraform remote state infrastructure (run once per AWS account).
# Creates an S3 bucket for state and a DynamoDB table for locking.

BUCKET_NAME="passly-terraform-state"
TABLE_NAME="passly-terraform-locks"
REGION="${AWS_REGION:-us-east-1}"

echo "Creating S3 bucket: ${BUCKET_NAME}"
aws s3api create-bucket \
  --bucket "${BUCKET_NAME}" \
  --region "${REGION}" \
  ${REGION:+$([ "$REGION" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=${REGION}" || echo "")}

echo "Enabling versioning on S3 bucket"
aws s3api put-bucket-versioning \
  --bucket "${BUCKET_NAME}" \
  --versioning-configuration Status=Enabled

echo "Enabling encryption on S3 bucket"
aws s3api put-bucket-encryption \
  --bucket "${BUCKET_NAME}" \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms"}}]
  }'

echo "Blocking public access on S3 bucket"
aws s3api put-public-access-block \
  --bucket "${BUCKET_NAME}" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "Creating DynamoDB table: ${TABLE_NAME}"
aws dynamodb create-table \
  --table-name "${TABLE_NAME}" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "${REGION}" || echo "Table already exists (this is fine)"

echo "Bootstrap complete. You can now run:"
echo "  cd infra && terraform init -backend-config=\"key=staging/terraform.tfstate\""
