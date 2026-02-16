import type { AWSSnapshot, CISCheck, CheckResult, CheckStatus } from '@/types/scan'
import cisChecksData from '@/data/cis-checks.json'

export const cisChecks: CISCheck[] = cisChecksData as CISCheck[]

type EvaluatorFn = (snapshot: AWSSnapshot) => { status: CheckStatus; detail: string }

const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 15,
  high: 10,
  medium: 5,
  low: 2,
}

const evaluators: Record<string, EvaluatorFn> = {
  root_mfa_enabled(snapshot) {
    const mfa = snapshot.account_summary?.AccountMFAEnabled
    if (mfa === 1) return { status: 'pass', detail: 'Root account MFA is enabled.' }
    return { status: 'fail', detail: 'Root account does not have MFA enabled.' }
  },

  password_min_length(snapshot) {
    if (!snapshot.password_policy) {
      return { status: 'fail', detail: 'No password policy is configured.' }
    }
    const len = snapshot.password_policy.MinimumPasswordLength ?? 0
    if (len >= 14) return { status: 'pass', detail: `Password minimum length is ${len}.` }
    return { status: 'fail', detail: `Password minimum length is ${len}, should be >= 14.` }
  },

  password_reuse_prevention(snapshot) {
    if (!snapshot.password_policy) {
      return { status: 'fail', detail: 'No password policy is configured.' }
    }
    const reuse = snapshot.password_policy.PasswordReusePrevention
    if (reuse && reuse >= 24) return { status: 'pass', detail: `Password reuse prevention set to ${reuse}.` }
    if (reuse) return { status: 'warning', detail: `Password reuse prevention is ${reuse}, recommended >= 24.` }
    return { status: 'fail', detail: 'Password reuse prevention is not configured.' }
  },

  users_mfa_enabled(snapshot) {
    const users = snapshot.users || []
    if (users.length === 0) return { status: 'pass', detail: 'No IAM users found.' }
    const withoutMfa = users.filter(u => u.MFADevices.length === 0)
    if (withoutMfa.length === 0) return { status: 'pass', detail: 'All IAM users have MFA enabled.' }
    return {
      status: 'fail',
      detail: `${withoutMfa.length} user(s) without MFA: ${withoutMfa.map(u => u.UserName).join(', ')}.`,
    }
  },

  no_root_access_keys(snapshot) {
    const keys = snapshot.account_summary?.AccountAccessKeysPresent
    if (keys === 0) return { status: 'pass', detail: 'No root account access keys exist.' }
    return { status: 'fail', detail: 'Root account has active access keys.' }
  },

  access_keys_rotated(snapshot) {
    const users = snapshot.users || []
    const now = Date.now()
    const ninetyDays = 90 * 24 * 60 * 60 * 1000
    const staleKeys: string[] = []

    for (const user of users) {
      for (const key of user.AccessKeys) {
        if (key.Status === 'Active') {
          const created = new Date(key.CreateDate).getTime()
          if (now - created > ninetyDays) {
            staleKeys.push(`${user.UserName}/${key.AccessKeyId}`)
          }
        }
      }
    }

    if (staleKeys.length === 0) return { status: 'pass', detail: 'All active access keys are within 90 days.' }
    return {
      status: 'fail',
      detail: `${staleKeys.length} key(s) older than 90 days: ${staleKeys.join(', ')}.`,
    }
  },

  cloudtrail_enabled(snapshot) {
    const trails = snapshot.trails || []
    const multiRegion = trails.find(t => t.IsMultiRegionTrail && t.IsLogging)
    if (multiRegion) return { status: 'pass', detail: `Multi-region trail "${multiRegion.Name}" is active.` }
    if (trails.some(t => t.IsLogging)) return { status: 'warning', detail: 'CloudTrail is enabled but not multi-region.' }
    return { status: 'fail', detail: 'No active CloudTrail trail found.' }
  },

  cloudtrail_log_validation(snapshot) {
    const trails = snapshot.trails || []
    if (trails.length === 0) return { status: 'fail', detail: 'No CloudTrail trails configured.' }
    const withValidation = trails.filter(t => t.LogFileValidationEnabled)
    if (withValidation.length === trails.length) return { status: 'pass', detail: 'All trails have log file validation enabled.' }
    return { status: 'fail', detail: `${trails.length - withValidation.length} trail(s) without log file validation.` }
  },

  cloudtrail_encrypted(snapshot) {
    const trails = snapshot.trails || []
    if (trails.length === 0) return { status: 'fail', detail: 'No CloudTrail trails configured.' }
    const encrypted = trails.filter(t => t.KmsKeyId)
    if (encrypted.length === trails.length) return { status: 'pass', detail: 'All trails are encrypted with KMS.' }
    return { status: 'fail', detail: `${trails.length - encrypted.length} trail(s) without KMS encryption.` }
  },

  vpc_flow_logs(snapshot) {
    const vpcs = snapshot.vpcs || []
    const flowLogs = snapshot.flow_logs || []
    if (vpcs.length === 0) return { status: 'pass', detail: 'No VPCs found.' }
    const coveredVpcs = new Set(flowLogs.map(fl => fl.ResourceId))
    const uncovered = vpcs.filter(v => !coveredVpcs.has(v))
    if (uncovered.length === 0) return { status: 'pass', detail: 'All VPCs have flow logs enabled.' }
    return { status: 'fail', detail: `${uncovered.length} VPC(s) without flow logs: ${uncovered.join(', ')}.` }
  },

  no_ssh_open(snapshot) {
    const offending = findOpenPort(snapshot.security_groups || [], 22)
    if (offending.length === 0) return { status: 'pass', detail: 'No security groups allow 0.0.0.0/0 to port 22.' }
    return { status: 'fail', detail: `${offending.length} group(s) allow SSH from 0.0.0.0/0: ${offending.join(', ')}.` }
  },

  no_rdp_open(snapshot) {
    const offending = findOpenPort(snapshot.security_groups || [], 3389)
    if (offending.length === 0) return { status: 'pass', detail: 'No security groups allow 0.0.0.0/0 to port 3389.' }
    return { status: 'fail', detail: `${offending.length} group(s) allow RDP from 0.0.0.0/0: ${offending.join(', ')}.` }
  },

  default_sg_restricted(snapshot) {
    const sgs = snapshot.security_groups || []
    const defaults = sgs.filter(sg => sg.GroupName === 'default')
    if (defaults.length === 0) return { status: 'pass', detail: 'No default security groups found.' }
    const unrestricted = defaults.filter(
      sg => sg.IpPermissions.length > 0 || sg.IpPermissionsEgress.length > 0
    )
    if (unrestricted.length === 0) return { status: 'pass', detail: 'All default security groups restrict traffic.' }
    return { status: 'fail', detail: `${unrestricted.length} default security group(s) have rules allowing traffic.` }
  },

  s3_public_access_blocked(snapshot) {
    const block = snapshot.s3_public_access_block
    if (!block) return { status: 'fail', detail: 'Account-level S3 public access block is not configured.' }
    if (block.BlockPublicAcls && block.IgnorePublicAcls && block.BlockPublicPolicy && block.RestrictPublicBuckets) {
      return { status: 'pass', detail: 'Account-level S3 public access is fully blocked.' }
    }
    return { status: 'warning', detail: 'Account-level S3 public access block is partially configured.' }
  },

  s3_encryption_enabled(snapshot) {
    const buckets = snapshot.buckets || []
    if (buckets.length === 0) return { status: 'pass', detail: 'No S3 buckets found.' }
    const unencrypted = buckets.filter(b => !b.Encryption)
    if (unencrypted.length === 0) return { status: 'pass', detail: 'All S3 buckets have server-side encryption.' }
    return {
      status: 'fail',
      detail: `${unencrypted.length} bucket(s) without encryption: ${unencrypted.map(b => b.Name).join(', ')}.`,
    }
  },

  s3_versioning_enabled(snapshot) {
    const buckets = snapshot.buckets || []
    if (buckets.length === 0) return { status: 'pass', detail: 'No S3 buckets found.' }
    const unversioned = buckets.filter(b => b.Versioning?.Status !== 'Enabled')
    if (unversioned.length === 0) return { status: 'pass', detail: 'All S3 buckets have versioning enabled.' }
    return {
      status: 'fail',
      detail: `${unversioned.length} bucket(s) without versioning: ${unversioned.map(b => b.Name).join(', ')}.`,
    }
  },
}

function findOpenPort(securityGroups: AWSSnapshot['security_groups'], port: number): string[] {
  const offending: string[] = []
  for (const sg of securityGroups) {
    for (const perm of sg.IpPermissions) {
      const isAllProtocol = perm.IpProtocol === '-1'
      const portInRange = perm.FromPort !== undefined && perm.ToPort !== undefined &&
        perm.FromPort <= port && perm.ToPort >= port
      if (isAllProtocol || portInRange) {
        const hasOpenIpv4 = perm.IpRanges.some(r => r.CidrIp === '0.0.0.0/0')
        const hasOpenIpv6 = perm.Ipv6Ranges?.some(r => r.CidrIpv6 === '::/0') ?? false
        if (hasOpenIpv4 || hasOpenIpv6) {
          offending.push(sg.GroupId)
        }
      }
    }
  }
  return offending
}

export function evaluateSnapshot(snapshot: AWSSnapshot): CheckResult[] {
  return cisChecks.map(check => {
    const evaluator = evaluators[check.evaluator]
    if (!evaluator) {
      return { check, status: 'warning' as CheckStatus, detail: 'Evaluator not implemented.' }
    }
    const { status, detail } = evaluator(snapshot)
    return { check, status, detail }
  })
}

export function calculateScore(results: CheckResult[]): number {
  let earned = 0
  let total = 0

  for (const result of results) {
    const weight = SEVERITY_WEIGHTS[result.check.severity] || 0
    total += weight
    if (result.status === 'pass') earned += weight
    else if (result.status === 'warning') earned += weight * 0.5
  }

  return total > 0 ? Math.round((earned / total) * 100) : 0
}
