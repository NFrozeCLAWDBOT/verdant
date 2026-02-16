output "api_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

output "s3_bucket" {
  value = aws_s3_bucket.website.id
}

output "s3_website_endpoint" {
  value = aws_s3_bucket_website_configuration.website.website_endpoint
}
