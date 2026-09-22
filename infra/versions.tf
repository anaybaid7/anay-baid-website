terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# us-east-1 is required here for one specific reason: an ACM certificate used
# by CloudFront (as opposed to by a regional service like an ALB) must be
# requested in us-east-1 regardless of where the bucket or the viewers are.
provider "aws" {
  region = "us-east-1"
}
