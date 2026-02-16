import json
import boto3
from datetime import datetime, timezone

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://verdant.nfroze.co.uk",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def lambda_handler(event, context):
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    try:
        body = json.loads(event.get("body", "{}"))
        access_key_id = body.get("accessKeyId")
        secret_access_key = body.get("secretAccessKey")
        region = body.get("region", "eu-west-2")

        if not access_key_id or not secret_access_key:
            return response(400, {"error": "Missing accessKeyId or secretAccessKey"})

        session = boto3.Session(
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name=region,
        )

        # Validate credentials
        sts = session.client("sts")
        try:
            identity = sts.get_caller_identity()
        except Exception:
            return response(401, {"error": "Invalid AWS credentials"})

        account_id = identity["Account"]
        snapshot = {"account_id": account_id}

        # IAM checks
        iam = session.client("iam")
        snapshot["account_summary"] = safe_call(
            lambda: iam.get_account_summary()["SummaryMap"]
        )
        snapshot["password_policy"] = safe_call(
            lambda: iam.get_account_password_policy()["PasswordPolicy"],
            not_found_value=None,
        )

        users = safe_call(lambda: iam.list_users()["Users"], default=[])
        user_details = []
        for user in users:
            username = user["UserName"]
            mfa_devices = safe_call(
                lambda u=username: iam.list_mfa_devices(UserName=u)["MFADevices"],
                default=[],
            )
            access_keys = safe_call(
                lambda u=username: iam.list_access_keys(UserName=u)[
                    "AccessKeyMetadata"
                ],
                default=[],
            )
            user_details.append(
                {
                    "UserName": username,
                    "MFADevices": mfa_devices,
                    "AccessKeys": [
                        {
                            "AccessKeyId": k["AccessKeyId"],
                            "Status": k["Status"],
                            "CreateDate": k["CreateDate"].isoformat(),
                        }
                        for k in access_keys
                    ],
                }
            )
        snapshot["users"] = user_details

        # S3 checks
        s3 = session.client("s3")
        s3control = session.client("s3control")

        snapshot["s3_public_access_block"] = safe_call(
            lambda: s3control.get_public_access_block(AccountId=account_id)[
                "PublicAccessBlockConfiguration"
            ]
        )

        buckets = safe_call(lambda: s3.list_buckets()["Buckets"], default=[])
        bucket_details = []
        for bucket in buckets:
            name = bucket["Name"]
            encryption = safe_call(
                lambda n=name: s3.get_bucket_encryption(Bucket=n)[
                    "ServerSideEncryptionConfiguration"
                ]
            )
            versioning = safe_call(
                lambda n=name: s3.get_bucket_versioning(Bucket=n)
            )
            bucket_details.append(
                {
                    "Name": name,
                    "Encryption": encryption,
                    "Versioning": versioning,
                }
            )
        snapshot["buckets"] = bucket_details

        # CloudTrail checks
        cloudtrail = session.client("cloudtrail")
        trails = safe_call(
            lambda: cloudtrail.describe_trails()["trailList"], default=[]
        )
        trail_details = []
        for trail in trails:
            trail_name = trail.get("TrailARN", trail.get("Name", ""))
            status = safe_call(lambda tn=trail_name: cloudtrail.get_trail_status(Name=tn))
            trail_details.append(
                {
                    "Name": trail.get("Name"),
                    "IsMultiRegionTrail": trail.get("IsMultiRegionTrail", False),
                    "LogFileValidationEnabled": trail.get(
                        "LogFileValidationEnabled", False
                    ),
                    "KmsKeyId": trail.get("KmsKeyId"),
                    "IsLogging": status.get("IsLogging", False) if status else False,
                }
            )
        snapshot["trails"] = trail_details

        # EC2 / Networking checks
        ec2 = session.client("ec2")
        snapshot["security_groups"] = safe_call(
            lambda: ec2.describe_security_groups()["SecurityGroups"], default=[]
        )

        vpcs = safe_call(lambda: ec2.describe_vpcs()["Vpcs"], default=[])
        snapshot["vpcs"] = [v["VpcId"] for v in vpcs]

        flow_logs = safe_call(
            lambda: ec2.describe_flow_logs()["FlowLogs"], default=[]
        )
        snapshot["flow_logs"] = [
            {"FlowLogId": fl["FlowLogId"], "ResourceId": fl["ResourceId"]}
            for fl in flow_logs
        ]

        return response(
            200,
            {
                "snapshot": snapshot,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "region": region,
            },
        )

    except json.JSONDecodeError:
        return response(400, {"error": "Invalid JSON body"})
    except Exception as e:
        error_msg = str(e)
        if "AccessDenied" in error_msg or "UnauthorizedAccess" in error_msg:
            return response(
                403,
                {
                    "error": "Insufficient permissions. Ensure the IAM user has read-only access."
                },
            )
        return response(502, {"error": f"AWS API error: {error_msg}"})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def safe_call(fn, default=None, not_found_value="NOT_SET"):
    try:
        return fn()
    except Exception as e:
        error_code = getattr(e, "response", {}).get("Error", {}).get("Code", "")
        if error_code == "NoSuchEntity" and not_found_value != "NOT_SET":
            return not_found_value
        if error_code in (
            "NoSuchEntity",
            "NoSuchBucketPolicy",
            "ServerSideEncryptionConfigurationNotFoundError",
            "NoSuchPublicAccessBlockConfiguration",
        ):
            return None
        return default
