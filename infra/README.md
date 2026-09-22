# Infrastructure (AWS, Terraform)

This isn't the way the live site is actually hosted right now (it's on
Netlify, see the root README), it's a second, parallel deployment target
written to demonstrate the current (2026) recommended pattern for hosting a
static SPA on AWS: **S3 + CloudFront with Origin Access Control**, not the
older "S3 static website hosting endpoint fronted by CloudFront + OAI"
pattern that's now legacy.

## What this creates

- A **private** S3 bucket (`aws_s3_bucket`) as the origin, versioned,
  encrypted at rest, with all public access blocked at the bucket level.
- A **CloudFront distribution** in front of it, reaching the bucket only via
  **Origin Access Control** (`aws_cloudfront_origin_access_control`), the
  current AWS-recommended replacement for the legacy Origin Access Identity.
  The bucket policy trusts the CloudFront service principal but scopes that
  trust to this one distribution's ARN (`AWS:SourceArn` condition), so no
  other CloudFront distribution in any account can read from this bucket.
- The managed `CachingOptimized` cache policy (no custom TTL resource
  needed for a static site with no cookie/query-string variance).
- Both 403 and 404 responses rewritten to `index.html` with a `200`, because
  this is a single-page app with no server-side routing: any path that
  isn't a literal file needs to still resolve to the app shell.
- An **optional** custom domain: set `domain_name` (and `route53_zone_id`)
  and this also requests and DNS-validates an ACM certificate and creates
  the Route53 alias record. Leave `domain_name` unset (the default) and the
  whole thing deploys cleanly on the CloudFront-assigned `*.cloudfront.net`
  domain, no owned domain or Route53 zone required, so `terraform plan`
  works for anyone who clones this repo.

## Usage

```bash
cd infra
terraform init
terraform plan    # -var="domain_name=example.com" -var="route53_zone_id=Z0123..." to use a custom domain
terraform apply
```

Then deploy the built site into the bucket the output prints:

```bash
npm run build
aws s3 sync dist/ "s3://$(terraform -chdir=infra output -raw bucket_name)" --delete
aws cloudfront create-invalidation \
  --distribution-id "$(terraform -chdir=infra output -raw cloudfront_distribution_id)" \
  --paths "/*"
```

## Honest caveats

- This was written to the current documented Terraform AWS provider (`~>
  5.0`) resource shapes and cross-checked against AWS's own OAC guidance,
  but the Terraform CLI wasn't available to run `terraform validate` or
  `terraform plan` against a real AWS account in the environment this was
  built in. `.github/workflows/infra-validate.yml` runs `terraform fmt
  -check` and a credential-free `terraform validate` on every change to
  this directory so syntax and internal consistency are checked in CI, but
  a real `apply` has not been exercised.
- `PriceClass_100` (North America + Europe edge locations only) keeps cost
  down; change it if global edge coverage matters.
- There's no state backend configured (defaults to local state). A real
  team deployment would add an `S3` + `DynamoDB` (or S3-native locking)
  backend block in `versions.tf`.
