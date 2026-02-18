resource "aws_s3_bucket" "match" {
  bucket = "passly-match-certificates"

  tags = merge(local.common_tags, { Name = "passly-match-certificates" })
}

resource "aws_s3_bucket_versioning" "match" {
  bucket = aws_s3_bucket.match.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "match" {
  bucket = aws_s3_bucket.match.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "match" {
  bucket = aws_s3_bucket.match.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
