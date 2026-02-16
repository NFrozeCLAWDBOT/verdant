#!/usr/bin/env bash
set -euo pipefail

# Verdant — AWS Security Posture Scanner (Offline Mode)
# This script collects AWS configuration data for CIS Benchmark evaluation.
# All data stays local. No credentials are transmitted.

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Prerequisite checks
for cmd in aws jq; do
  if ! command -v "$cmd" &>/dev/null; then
    echo -e "${RED}Error: $cmd is required but not installed.${NC}" >&2
    exit 1
  fi
done

echo -e "${GREEN}Verdant Scan — Collecting AWS configuration...${NC}" >&2

# Get account identity
IDENTITY=$(aws sts get-caller-identity 2>/dev/null)
ACCOUNT_ID=$(echo "$IDENTITY" | jq -r '.Account')

echo -e "  Account: ${ACCOUNT_ID}" >&2

# IAM: Account summary
ACCOUNT_SUMMARY=$(aws iam get-account-summary --query 'SummaryMap' 2>/dev/null || echo 'null')

# IAM: Password policy
PASSWORD_POLICY=$(aws iam get-account-password-policy --query 'PasswordPolicy' 2>/dev/null || echo 'null')

# IAM: Users with MFA and access keys
USERS_RAW=$(aws iam list-users --query 'Users[].UserName' --output json 2>/dev/null || echo '[]')
USERS="[]"
if [ "$USERS_RAW" != "[]" ]; then
  USERS=$(echo "$USERS_RAW" | jq -c '.[]' | while read -r USERNAME; do
    USERNAME=$(echo "$USERNAME" | jq -r '.')
    MFA_DEVICES=$(aws iam list-mfa-devices --user-name "$USERNAME" --query 'MFADevices' 2>/dev/null || echo '[]')
    ACCESS_KEYS=$(aws iam list-access-keys --user-name "$USERNAME" --query 'AccessKeyMetadata[].{AccessKeyId:AccessKeyId,Status:Status,CreateDate:CreateDate}' 2>/dev/null || echo '[]')
    jq -n --arg u "$USERNAME" --argjson m "$MFA_DEVICES" --argjson k "$ACCESS_KEYS" \
      '{UserName: $u, MFADevices: $m, AccessKeys: $k}'
  done | jq -s '.')
fi

# S3: Account-level public access block
S3_PUBLIC_ACCESS=$(aws s3control get-public-access-block --account-id "$ACCOUNT_ID" --query 'PublicAccessBlockConfiguration' 2>/dev/null || echo 'null')

# S3: Buckets with encryption and versioning
BUCKETS_RAW=$(aws s3api list-buckets --query 'Buckets[].Name' --output json 2>/dev/null || echo '[]')
BUCKETS="[]"
if [ "$BUCKETS_RAW" != "[]" ]; then
  BUCKETS=$(echo "$BUCKETS_RAW" | jq -c '.[]' | while read -r BUCKET; do
    BUCKET=$(echo "$BUCKET" | jq -r '.')
    ENCRYPTION=$(aws s3api get-bucket-encryption --bucket "$BUCKET" --query 'ServerSideEncryptionConfiguration' 2>/dev/null || echo 'null')
    VERSIONING=$(aws s3api get-bucket-versioning --bucket "$BUCKET" 2>/dev/null || echo '{}')
    jq -n --arg n "$BUCKET" --argjson e "$ENCRYPTION" --argjson v "$VERSIONING" \
      '{Name: $n, Encryption: $e, Versioning: $v}'
  done | jq -s '.')
fi

# CloudTrail
TRAILS_RAW=$(aws cloudtrail describe-trails --query 'trailList' 2>/dev/null || echo '[]')
TRAILS="[]"
if [ "$TRAILS_RAW" != "[]" ]; then
  TRAILS=$(echo "$TRAILS_RAW" | jq -c '.[]' | while read -r TRAIL; do
    TRAIL_ARN=$(echo "$TRAIL" | jq -r '.TrailARN // .Name')
    STATUS=$(aws cloudtrail get-trail-status --name "$TRAIL_ARN" 2>/dev/null || echo '{}')
    IS_LOGGING=$(echo "$STATUS" | jq -r '.IsLogging // false')
    echo "$TRAIL" | jq --argjson logging "$IS_LOGGING" \
      '{Name: .Name, IsMultiRegionTrail: .IsMultiRegionTrail, LogFileValidationEnabled: .LogFileValidationEnabled, KmsKeyId: .KmsKeyId, IsLogging: $logging}'
  done | jq -s '.')
fi

# EC2: Security groups
SECURITY_GROUPS=$(aws ec2 describe-security-groups --query 'SecurityGroups' 2>/dev/null || echo '[]')

# EC2: VPCs and flow logs
VPCS=$(aws ec2 describe-vpcs --query 'Vpcs[].VpcId' 2>/dev/null || echo '[]')
FLOW_LOGS=$(aws ec2 describe-flow-logs --query 'FlowLogs[].{FlowLogId:FlowLogId,ResourceId:ResourceId}' 2>/dev/null || echo '[]')

echo -e "${GREEN}Scan complete. Outputting JSON snapshot...${NC}" >&2

# Build and output final JSON
jq -n \
  --arg account_id "$ACCOUNT_ID" \
  --argjson account_summary "$ACCOUNT_SUMMARY" \
  --argjson password_policy "$PASSWORD_POLICY" \
  --argjson users "$USERS" \
  --argjson s3_public_access_block "$S3_PUBLIC_ACCESS" \
  --argjson buckets "$BUCKETS" \
  --argjson trails "$TRAILS" \
  --argjson security_groups "$SECURITY_GROUPS" \
  --argjson vpcs "$VPCS" \
  --argjson flow_logs "$FLOW_LOGS" \
  '{
    account_id: $account_id,
    account_summary: $account_summary,
    password_policy: $password_policy,
    users: $users,
    s3_public_access_block: $s3_public_access_block,
    buckets: $buckets,
    trails: $trails,
    security_groups: $security_groups,
    vpcs: $vpcs,
    flow_logs: $flow_logs
  }'
