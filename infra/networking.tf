################################################################################
# VPC
################################################################################

resource "aws_vpc" "main" {
  count = local.enable_full_stack ? 1 : 0

  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${local.prefix}-vpc" }
}

################################################################################
# Internet Gateway
################################################################################

resource "aws_internet_gateway" "main" {
  count  = local.enable_full_stack ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  tags = { Name = "${local.prefix}-igw" }
}

################################################################################
# Public Subnets
################################################################################

resource "aws_subnet" "public" {
  count = local.enable_full_stack ? length(local.azs) : 0

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = local.public_subnets[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${local.prefix}-public-${local.azs[count.index]}" }
}

resource "aws_route_table" "public" {
  count  = local.enable_full_stack ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  tags = { Name = "${local.prefix}-public-rt" }
}

resource "aws_route" "public_internet" {
  count                  = local.enable_full_stack ? 1 : 0
  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main[0].id
}

resource "aws_route_table_association" "public" {
  count = local.enable_full_stack ? length(local.azs) : 0

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

################################################################################
# Database Subnets (isolated — no NAT route)
################################################################################

resource "aws_subnet" "database" {
  count = local.enable_full_stack ? length(local.azs) : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = local.database_subnets[count.index]
  availability_zone = local.azs[count.index]

  tags = { Name = "${local.prefix}-db-${local.azs[count.index]}" }
}

resource "aws_db_subnet_group" "main" {
  count = local.enable_full_stack ? 1 : 0

  name       = "${local.prefix}-db"
  subnet_ids = aws_subnet.database[*].id

  tags = { Name = "${local.prefix}-db-subnet-group" }
}
