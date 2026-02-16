export interface AWSSnapshot {
  account_id: string
  account_summary: AccountSummary | null
  password_policy: PasswordPolicy | null
  users: IAMUser[]
  s3_public_access_block: S3PublicAccessBlock | null
  buckets: S3Bucket[]
  trails: CloudTrail[]
  security_groups: SecurityGroup[]
  vpcs: string[]
  flow_logs: FlowLog[]
}

export interface AccountSummary {
  AccountMFAEnabled: number
  AccountAccessKeysPresent: number
  [key: string]: number
}

export interface PasswordPolicy {
  MinimumPasswordLength?: number
  PasswordReusePrevention?: number
  RequireSymbols?: boolean
  RequireNumbers?: boolean
  RequireUppercaseCharacters?: boolean
  RequireLowercaseCharacters?: boolean
  MaxPasswordAge?: number
  ExpirePasswords?: boolean
}

export interface IAMUser {
  UserName: string
  MFADevices: { SerialNumber: string }[]
  AccessKeys: AccessKey[]
}

export interface AccessKey {
  AccessKeyId: string
  Status: string
  CreateDate: string
}

export interface S3PublicAccessBlock {
  BlockPublicAcls: boolean
  IgnorePublicAcls: boolean
  BlockPublicPolicy: boolean
  RestrictPublicBuckets: boolean
}

export interface S3Bucket {
  Name: string
  Encryption: {
    Rules: { ApplyServerSideEncryptionByDefault: { SSEAlgorithm: string } }[]
  } | null
  Versioning: {
    Status?: string
    MFADelete?: string
  } | null
}

export interface CloudTrail {
  Name: string
  IsMultiRegionTrail: boolean
  LogFileValidationEnabled: boolean
  KmsKeyId: string | null
  IsLogging: boolean
}

export interface SecurityGroup {
  GroupId: string
  GroupName: string
  IpPermissions: IpPermission[]
  IpPermissionsEgress: IpPermission[]
}

export interface IpPermission {
  IpProtocol: string
  FromPort?: number
  ToPort?: number
  IpRanges: { CidrIp: string }[]
  Ipv6Ranges?: { CidrIpv6: string }[]
}

export interface FlowLog {
  FlowLogId: string
  ResourceId: string
}

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type CheckStatus = 'pass' | 'fail' | 'warning'
export type Category = 'Identity and Access Management' | 'Logging' | 'Monitoring' | 'Networking' | 'Storage'

export interface CISCheck {
  id: string
  category: Category
  title: string
  description: string
  severity: Severity
  evaluator: string
  remediation: {
    description: string
    command: string | null
    consoleSteps: string[] | null
  }
}

export interface CheckResult {
  check: CISCheck
  status: CheckStatus
  detail: string
}

export interface ScanResult {
  score: number
  results: CheckResult[]
  timestamp: string
  region: string
}

export interface HistoryScan {
  timestamp: string
  score: number
  results: CheckResult[]
}
