# Aurora manages the master password automatically via manage_master_user_password = true.
# The secret ARN is available at: aws_rds_cluster.main.master_user_secret[0].secret_arn
# ECS tasks retrieve the password at container startup via the "secrets" block
# in their task definitions, referencing the specific JSON key "password".

locals {
  db_secret_arn = aws_rds_cluster.main.master_user_secret[0].secret_arn

  # Connection string base (without password — injected via DB_PASSWORD env var)
  db_connection_string = "Host=${aws_rds_cluster.main.endpoint};Port=5432;Database=${var.db_name};Username=${aws_rds_cluster.main.master_username}"
}
