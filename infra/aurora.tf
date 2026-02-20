resource "aws_rds_cluster" "main" {
  count = local.enable_full_stack ? 1 : 0

  cluster_identifier = "${local.prefix}-aurora"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = "17.4"
  database_name      = var.db_name
  master_username    = "passly"

  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main[0].name
  vpc_security_group_ids = [aws_security_group.aurora[0].id]

  skip_final_snapshot       = var.environment == "staging"
  final_snapshot_identifier = var.environment == "prod" ? "${local.prefix}-final-snapshot" : null

  serverlessv2_scaling_configuration {
    min_capacity = var.aurora_min_capacity
    max_capacity = var.aurora_max_capacity
  }

  tags = { Name = "${local.prefix}-aurora" }
}

resource "aws_rds_cluster_instance" "main" {
  count              = local.enable_full_stack ? 1 : 0
  cluster_identifier = aws_rds_cluster.main[0].id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main[0].engine
  engine_version     = aws_rds_cluster.main[0].engine_version

  tags = { Name = "${local.prefix}-aurora-instance" }
}
