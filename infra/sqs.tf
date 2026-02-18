resource "aws_sqs_queue" "imports_dlq" {
  name                      = "${local.prefix}-imports-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = { Name = "${local.prefix}-imports-dlq" }
}

resource "aws_sqs_queue" "imports" {
  name                       = "${local.prefix}-imports"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600 # 14 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.imports_dlq.arn
    maxReceiveCount     = 3
  })

  tags = { Name = "${local.prefix}-imports" }
}
