data "archive_file" "scan" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/scan"
  output_path = "${path.module}/../lambda/scan.zip"
}

data "archive_file" "history" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/history"
  output_path = "${path.module}/../lambda/history.zip"
}

resource "aws_lambda_function" "scan" {
  function_name    = "${var.project_name}-scan"
  role             = aws_iam_role.lambda_scan.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  memory_size      = 256
  timeout          = 30
  filename         = data.archive_file.scan.output_path
  source_code_hash = data.archive_file.scan.output_base64sha256
}

resource "aws_lambda_function" "history" {
  function_name    = "${var.project_name}-history"
  role             = aws_iam_role.lambda_history.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  memory_size      = 128
  timeout          = 10
  filename         = data.archive_file.history.output_path
  source_code_hash = data.archive_file.history.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.scans.name
    }
  }
}

resource "aws_lambda_permission" "scan_apigw" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scan.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "history_apigw" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.history.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
