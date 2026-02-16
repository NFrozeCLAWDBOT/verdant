resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://${var.domain_name}"]
    allow_methods = ["POST", "GET", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

# Scan integration + route
resource "aws_apigatewayv2_integration" "scan" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.scan.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "scan" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /api/scan"
  target    = "integrations/${aws_apigatewayv2_integration.scan.id}"
}

# History integration + routes
resource "aws_apigatewayv2_integration" "history" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.history.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "history_save" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /api/history/save"
  target    = "integrations/${aws_apigatewayv2_integration.history.id}"
}

resource "aws_apigatewayv2_route" "history_get" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/history/{sessionToken}"
  target    = "integrations/${aws_apigatewayv2_integration.history.id}"
}
