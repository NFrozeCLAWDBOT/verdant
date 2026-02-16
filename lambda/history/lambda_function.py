import json
import os
import boto3
from decimal import Decimal

TABLE_NAME = os.environ.get("TABLE_NAME", "verdant-scans")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://verdant.nfroze.co.uk",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o == int(o) else float(o)
        return super().default(o)


def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if method == "POST":
        return save_scan(event)
    elif method == "GET":
        return get_history(event)
    else:
        return response(405, {"error": "Method not allowed"})


def save_scan(event):
    try:
        body = json.loads(event.get("body", "{}"), parse_float=Decimal)
        session_token = body.get("sessionToken")
        timestamp = body.get("timestamp")
        score = body.get("score")
        results = body.get("results")

        if not all([session_token, timestamp, score is not None, results]):
            return response(400, {"error": "Missing required fields"})

        table.put_item(
            Item={
                "sessionToken": session_token,
                "timestamp": timestamp,
                "score": Decimal(str(score)),
                "results": json.loads(json.dumps(results), parse_float=Decimal),
            }
        )

        return response(200, {"message": "Scan saved successfully"})

    except json.JSONDecodeError:
        return response(400, {"error": "Invalid JSON body"})
    except Exception as e:
        return response(500, {"error": f"Failed to save scan: {str(e)}"})


def get_history(event):
    try:
        path_params = event.get("pathParameters", {}) or {}
        session_token = path_params.get("sessionToken")

        if not session_token:
            return response(400, {"error": "Missing sessionToken"})

        result = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("sessionToken").eq(
                session_token
            ),
            ScanIndexForward=True,
        )

        scans = [
            {
                "timestamp": item["timestamp"],
                "score": item["score"],
                "results": item.get("results", {}),
            }
            for item in result.get("Items", [])
        ]

        return response(200, {"scans": scans})

    except Exception as e:
        return response(500, {"error": f"Failed to retrieve history: {str(e)}"})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, cls=DecimalEncoder),
    }
