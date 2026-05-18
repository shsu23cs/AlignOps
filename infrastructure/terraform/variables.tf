variable "aws_region" {
  type        = string
  description = "The AWS Region to deploy into"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Deployment environment name"
  default     = "production"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for public subnets"
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for private subnets"
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "database_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for database subnets"
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
}

variable "availability_zones" {
  type        = list(string)
  description = "Availability zones to map"
  default     = ["us-east-1a", "us-east-1b"]
}

variable "db_username" {
  type        = string
  description = "Database administrator username"
  default     = "alignops_admin"
}

variable "db_password" {
  type        = string
  description = "Database administrator password"
  sensitive   = true
}

variable "jwt_secret" {
  type        = string
  description = "Secret key for signing JWT tokens"
  sensitive   = true
}

variable "ecr_registry" {
  type        = string
  description = "ECR registry url for pulling Docker containers"
  default     = "123456789012.dkr.ecr.us-east-1.amazonaws.com"
}
