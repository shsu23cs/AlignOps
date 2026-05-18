# RDS PostgreSQL Database Configuration (Production-grade & High-Availability)

resource "aws_db_subnet_group" "db_subnet_group" {
  name        = "${var.environment}-db-subnet-group"
  description = "DB Subnet Group for isolated private subnets"
  subnet_ids  = aws_subnet.database[*].id

  tags = {
    Name        = "${var.environment}-db-subnet-group"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.environment}-rds-security-group"
  description = "Allow inbound PostgreSQL traffic from ECS private subnets only"
  vpc_id      = aws_vpc.main.id

  # Inbound rule allowing TCP 5432 from Private App Subnets
  ingress {
    description     = "Allow ECS task connections"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-rds-sg"
    Environment = var.environment
  }
}

resource "aws_kms_key" "rds_key" {
  description             = "KMS Key for RDS encryption at rest"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.environment}-rds-kms-key"
    Environment = var.environment
  }
}

resource "aws_db_instance" "db" {
  identifier                  = "${var.environment}-alignops-db"
  allocated_storage           = 20
  max_allocated_storage       = 100 # Auto-scaling database disk storage
  engine                      = "postgres"
  engine_version              = "15.5"
  instance_class              = "db.t4g.medium" # Graviton processor for optimized price-to-performance
  db_name                     = "alignops"
  username                    = var.db_username
  password                    = var.db_password # Secured using TF secrets variables
  port                        = 5432
  db_subnet_group_name        = aws_db_subnet_group.db_subnet_group.name
  vpc_security_group_ids      = [aws_security_group.rds_sg.id]
  
  # Highly resilient settings
  multi_az                    = true # Provision standby replica in second AZ for instant failover
  storage_encrypted           = true
  kms_key_id                  = aws_kms_key.rds_key.arn
  publicly_accessible         = false
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.environment}-alignops-db-final-snapshot"
  deletion_protection         = true

  # Backup policies
  backup_retention_period     = 7
  backup_window               = "03:00-04:00"
  maintenance_window          = "Sun:04:30-Sun:05:30"

  tags = {
    Name        = "${var.environment}-db-instance"
    Environment = var.environment
  }
}
