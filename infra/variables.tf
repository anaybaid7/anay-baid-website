variable "bucket_name" {
  description = "Globally-unique S3 bucket name for the site's origin. Bucket names are a shared global namespace across all AWS accounts, so this can't default to something generic like \"portfolio\"."
  type        = string
  default     = "anay-baid-portfolio-origin"
}

variable "domain_name" {
  description = <<-EOT
    Optional custom domain (e.g. "anaybaid.com") to serve the site from,
    fronted by an ACM certificate and an alias record in Route53.
    Leave as null to deploy on the CloudFront-assigned *.cloudfront.net
    domain only, no owned domain or hosted zone required. This makes
    `terraform plan`/`apply` usable by anyone cloning this repo, not just
    someone who already owns anaybaid.com.
  EOT
  type        = string
  default     = null
}

variable "route53_zone_id" {
  description = "Hosted zone ID for var.domain_name. Required only when domain_name is set; ignored otherwise."
  type        = string
  default     = null
}

variable "tags" {
  description = "Common tags applied to every resource this config creates."
  type        = map(string)
  default = {
    Project   = "anay-baid-portfolio"
    ManagedBy = "terraform"
  }
}
