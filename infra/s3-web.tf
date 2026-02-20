resource "aws_s3_bucket" "web" {
  count = local.enable_full_stack ? 1 : 0

  bucket        = "${local.prefix}-web"
  force_destroy = var.environment == "staging"

  tags = { Name = "${local.prefix}-web" }
}

resource "aws_s3_bucket_public_access_block" "web" {
  count  = local.enable_full_stack ? 1 : 0
  bucket = aws_s3_bucket.web[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "web" {
  count  = local.enable_full_stack ? 1 : 0
  bucket = aws_s3_bucket.web[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "CloudFrontReadOnly"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.web[0].arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.main[0].arn
        }
      }
    }]
  })
}
