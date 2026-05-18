output "vpc_id" {
  value       = aws_vpc.main.id
  description = "The ID of the VPC"
}

output "load_balancer_dns" {
  value       = aws_lb.main.dns_name
  description = "The public DNS url of the Application Load Balancer"
}

output "database_endpoint" {
  value       = aws_db_instance.db.endpoint
  description = "The endpoint of the RDS PostgreSQL instance"
}
