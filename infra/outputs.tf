output "bucket_name" {
  description = "S3 bucket holding the built site (the deploy step syncs dist/ here)."
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "Needed for the cache invalidation step after every deploy (aws cloudfront create-invalidation)."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "The *.cloudfront.net domain the site is reachable at when no custom domain is configured."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "site_url" {
  description = "The URL to actually visit: the custom domain if configured, otherwise the CloudFront domain."
  value       = local.use_custom_domain ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.site.domain_name}"
}
