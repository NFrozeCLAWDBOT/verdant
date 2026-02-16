resource "cloudflare_record" "verdant" {
  zone_id = var.cloudflare_zone_id
  name    = "verdant"
  content = aws_s3_bucket_website_configuration.website.website_endpoint
  type    = "CNAME"
  proxied = true
}
