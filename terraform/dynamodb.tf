resource "aws_dynamodb_table" "scans" {
  name         = "${var.project_name}-scans"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionToken"
  range_key    = "timestamp"

  attribute {
    name = "sessionToken"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }
}
