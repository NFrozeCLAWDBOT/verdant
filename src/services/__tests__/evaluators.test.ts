import { describe, it, expect } from 'vitest'
import { evaluateSnapshot, calculateScore } from '../evaluators'
import type { AWSSnapshot } from '@/types/scan'

function makeSnapshot(overrides: Partial<AWSSnapshot> = {}): AWSSnapshot {
  return {
    account_id: '123456789012',
    account_summary: { AccountMFAEnabled: 1, AccountAccessKeysPresent: 0 },
    password_policy: {
      MinimumPasswordLength: 14,
      PasswordReusePrevention: 24,
      RequireSymbols: true,
      RequireNumbers: true,
      RequireUppercaseCharacters: true,
      RequireLowercaseCharacters: true,
    },
    users: [],
    s3_public_access_block: {
      BlockPublicAcls: true,
      IgnorePublicAcls: true,
      BlockPublicPolicy: true,
      RestrictPublicBuckets: true,
    },
    buckets: [],
    trails: [
      {
        Name: 'test-trail',
        IsMultiRegionTrail: true,
        LogFileValidationEnabled: true,
        KmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/abc',
        IsLogging: true,
      },
    ],
    security_groups: [],
    vpcs: [],
    flow_logs: [],
    ...overrides,
  }
}

describe('CIS Check Evaluators', () => {
  // 1.1 Root MFA
  it('1.1 passes when root MFA is enabled', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const r = results.find(r => r.check.id === '1.1')!
    expect(r.status).toBe('pass')
  })
  it('1.1 fails when root MFA is disabled', () => {
    const results = evaluateSnapshot(makeSnapshot({ account_summary: { AccountMFAEnabled: 0, AccountAccessKeysPresent: 0 } }))
    const r = results.find(r => r.check.id === '1.1')!
    expect(r.status).toBe('fail')
  })

  // 1.2 Password min length
  it('1.2 passes when password length >= 14', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const r = results.find(r => r.check.id === '1.2')!
    expect(r.status).toBe('pass')
  })
  it('1.2 fails when password length < 14', () => {
    const results = evaluateSnapshot(makeSnapshot({ password_policy: { MinimumPasswordLength: 8 } }))
    const r = results.find(r => r.check.id === '1.2')!
    expect(r.status).toBe('fail')
  })

  // 1.3 Password reuse prevention
  it('1.3 passes when reuse prevention >= 24', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const r = results.find(r => r.check.id === '1.3')!
    expect(r.status).toBe('pass')
  })
  it('1.3 fails when no password policy', () => {
    const results = evaluateSnapshot(makeSnapshot({ password_policy: null }))
    const r = results.find(r => r.check.id === '1.3')!
    expect(r.status).toBe('fail')
  })

  // 1.4 Users MFA
  it('1.4 passes when all users have MFA', () => {
    const results = evaluateSnapshot(makeSnapshot({
      users: [{ UserName: 'alice', MFADevices: [{ SerialNumber: 'arn:...' }], AccessKeys: [] }],
    }))
    const r = results.find(r => r.check.id === '1.4')!
    expect(r.status).toBe('pass')
  })
  it('1.4 fails when a user has no MFA', () => {
    const results = evaluateSnapshot(makeSnapshot({
      users: [{ UserName: 'bob', MFADevices: [], AccessKeys: [] }],
    }))
    const r = results.find(r => r.check.id === '1.4')!
    expect(r.status).toBe('fail')
  })

  // 1.5 No root access keys
  it('1.5 passes when no root access keys', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const r = results.find(r => r.check.id === '1.5')!
    expect(r.status).toBe('pass')
  })
  it('1.5 fails when root has access keys', () => {
    const results = evaluateSnapshot(makeSnapshot({
      account_summary: { AccountMFAEnabled: 1, AccountAccessKeysPresent: 1 },
    }))
    const r = results.find(r => r.check.id === '1.5')!
    expect(r.status).toBe('fail')
  })

  // 1.6 Access keys rotated
  it('1.6 passes when keys are fresh', () => {
    const results = evaluateSnapshot(makeSnapshot({
      users: [{
        UserName: 'alice',
        MFADevices: [{ SerialNumber: 'arn:...' }],
        AccessKeys: [{ AccessKeyId: 'AKIA1', Status: 'Active', CreateDate: new Date().toISOString() }],
      }],
    }))
    const r = results.find(r => r.check.id === '1.6')!
    expect(r.status).toBe('pass')
  })
  it('1.6 fails when keys are stale', () => {
    const staleDate = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
    const results = evaluateSnapshot(makeSnapshot({
      users: [{
        UserName: 'alice',
        MFADevices: [{ SerialNumber: 'arn:...' }],
        AccessKeys: [{ AccessKeyId: 'AKIA1', Status: 'Active', CreateDate: staleDate }],
      }],
    }))
    const r = results.find(r => r.check.id === '1.6')!
    expect(r.status).toBe('fail')
  })

  // 2.1 CloudTrail enabled
  it('2.1 passes with multi-region trail', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const r = results.find(r => r.check.id === '2.1')!
    expect(r.status).toBe('pass')
  })
  it('2.1 fails with no trails', () => {
    const results = evaluateSnapshot(makeSnapshot({ trails: [] }))
    const r = results.find(r => r.check.id === '2.1')!
    expect(r.status).toBe('fail')
  })

  // 2.2 CloudTrail log validation
  it('2.2 passes when validation enabled', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const r = results.find(r => r.check.id === '2.2')!
    expect(r.status).toBe('pass')
  })
  it('2.2 fails when validation disabled', () => {
    const results = evaluateSnapshot(makeSnapshot({
      trails: [{ Name: 't', IsMultiRegionTrail: true, LogFileValidationEnabled: false, KmsKeyId: 'k', IsLogging: true }],
    }))
    const r = results.find(r => r.check.id === '2.2')!
    expect(r.status).toBe('fail')
  })

  // 2.3 CloudTrail encrypted
  it('2.3 passes when encrypted', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const r = results.find(r => r.check.id === '2.3')!
    expect(r.status).toBe('pass')
  })
  it('2.3 fails when not encrypted', () => {
    const results = evaluateSnapshot(makeSnapshot({
      trails: [{ Name: 't', IsMultiRegionTrail: true, LogFileValidationEnabled: true, KmsKeyId: null, IsLogging: true }],
    }))
    const r = results.find(r => r.check.id === '2.3')!
    expect(r.status).toBe('fail')
  })

  // 3.1 VPC flow logs
  it('3.1 passes when all VPCs have flow logs', () => {
    const results = evaluateSnapshot(makeSnapshot({
      vpcs: ['vpc-1'],
      flow_logs: [{ FlowLogId: 'fl-1', ResourceId: 'vpc-1' }],
    }))
    const r = results.find(r => r.check.id === '3.1')!
    expect(r.status).toBe('pass')
  })
  it('3.1 fails when VPC has no flow logs', () => {
    const results = evaluateSnapshot(makeSnapshot({ vpcs: ['vpc-1'], flow_logs: [] }))
    const r = results.find(r => r.check.id === '3.1')!
    expect(r.status).toBe('fail')
  })

  // 4.1 No SSH open
  it('4.1 passes when no SSH open', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const r = results.find(r => r.check.id === '4.1')!
    expect(r.status).toBe('pass')
  })
  it('4.1 fails when SSH open to 0.0.0.0/0', () => {
    const results = evaluateSnapshot(makeSnapshot({
      security_groups: [{
        GroupId: 'sg-1', GroupName: 'test',
        IpPermissions: [{ IpProtocol: 'tcp', FromPort: 22, ToPort: 22, IpRanges: [{ CidrIp: '0.0.0.0/0' }] }],
        IpPermissionsEgress: [],
      }],
    }))
    const r = results.find(r => r.check.id === '4.1')!
    expect(r.status).toBe('fail')
  })

  // 4.2 No RDP open
  it('4.2 passes when no RDP open', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const r = results.find(r => r.check.id === '4.2')!
    expect(r.status).toBe('pass')
  })
  it('4.2 fails when RDP open to 0.0.0.0/0', () => {
    const results = evaluateSnapshot(makeSnapshot({
      security_groups: [{
        GroupId: 'sg-1', GroupName: 'test',
        IpPermissions: [{ IpProtocol: 'tcp', FromPort: 3389, ToPort: 3389, IpRanges: [{ CidrIp: '0.0.0.0/0' }] }],
        IpPermissionsEgress: [],
      }],
    }))
    const r = results.find(r => r.check.id === '4.2')!
    expect(r.status).toBe('fail')
  })

  // 4.3 Default SG restricted
  it('4.3 passes when default SG has no rules', () => {
    const results = evaluateSnapshot(makeSnapshot({
      security_groups: [{ GroupId: 'sg-1', GroupName: 'default', IpPermissions: [], IpPermissionsEgress: [] }],
    }))
    const r = results.find(r => r.check.id === '4.3')!
    expect(r.status).toBe('pass')
  })
  it('4.3 fails when default SG has rules', () => {
    const results = evaluateSnapshot(makeSnapshot({
      security_groups: [{
        GroupId: 'sg-1', GroupName: 'default',
        IpPermissions: [{ IpProtocol: '-1', IpRanges: [] }],
        IpPermissionsEgress: [],
      }],
    }))
    const r = results.find(r => r.check.id === '4.3')!
    expect(r.status).toBe('fail')
  })

  // 5.1 S3 public access blocked
  it('5.1 passes when fully blocked', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const r = results.find(r => r.check.id === '5.1')!
    expect(r.status).toBe('pass')
  })
  it('5.1 fails when not configured', () => {
    const results = evaluateSnapshot(makeSnapshot({ s3_public_access_block: null }))
    const r = results.find(r => r.check.id === '5.1')!
    expect(r.status).toBe('fail')
  })

  // 5.2 S3 encryption
  it('5.2 passes when all buckets encrypted', () => {
    const results = evaluateSnapshot(makeSnapshot({
      buckets: [{ Name: 'b1', Encryption: { Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }] }, Versioning: { Status: 'Enabled' } }],
    }))
    const r = results.find(r => r.check.id === '5.2')!
    expect(r.status).toBe('pass')
  })
  it('5.2 fails when bucket has no encryption', () => {
    const results = evaluateSnapshot(makeSnapshot({
      buckets: [{ Name: 'b1', Encryption: null, Versioning: null }],
    }))
    const r = results.find(r => r.check.id === '5.2')!
    expect(r.status).toBe('fail')
  })

  // 5.3 S3 versioning
  it('5.3 passes when all buckets versioned', () => {
    const results = evaluateSnapshot(makeSnapshot({
      buckets: [{ Name: 'b1', Encryption: { Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }] }, Versioning: { Status: 'Enabled' } }],
    }))
    const r = results.find(r => r.check.id === '5.3')!
    expect(r.status).toBe('pass')
  })
  it('5.3 fails when bucket has no versioning', () => {
    const results = evaluateSnapshot(makeSnapshot({
      buckets: [{ Name: 'b1', Encryption: null, Versioning: null }],
    }))
    const r = results.find(r => r.check.id === '5.3')!
    expect(r.status).toBe('fail')
  })

  // 4.1 with protocol -1 (all traffic)
  it('4.1 fails when protocol -1 allows all traffic from 0.0.0.0/0', () => {
    const results = evaluateSnapshot(makeSnapshot({
      security_groups: [{
        GroupId: 'sg-all', GroupName: 'wide-open',
        IpPermissions: [{ IpProtocol: '-1', IpRanges: [{ CidrIp: '0.0.0.0/0' }] }],
        IpPermissionsEgress: [],
      }],
    }))
    const r = results.find(r => r.check.id === '4.1')!
    expect(r.status).toBe('fail')
  })
})

describe('calculateScore', () => {
  it('returns 100 for all passes', () => {
    const results = evaluateSnapshot(makeSnapshot())
    const score = calculateScore(results)
    expect(score).toBe(100)
  })

  it('returns 0 for all fails', () => {
    const results = evaluateSnapshot(makeSnapshot({
      account_summary: { AccountMFAEnabled: 0, AccountAccessKeysPresent: 1 },
      password_policy: null,
      users: [{ UserName: 'bob', MFADevices: [], AccessKeys: [{ AccessKeyId: 'AKIA1', Status: 'Active', CreateDate: '2020-01-01T00:00:00Z' }] }],
      s3_public_access_block: null,
      buckets: [{ Name: 'b1', Encryption: null, Versioning: null }],
      trails: [],
      security_groups: [{
        GroupId: 'sg-1', GroupName: 'default',
        IpPermissions: [{ IpProtocol: '-1', IpRanges: [{ CidrIp: '0.0.0.0/0' }] }],
        IpPermissionsEgress: [{ IpProtocol: '-1', IpRanges: [] }],
      }],
      vpcs: ['vpc-1'],
      flow_logs: [],
    }))
    const score = calculateScore(results)
    expect(score).toBe(0)
  })

  it('returns a value between 0 and 100', () => {
    const results = evaluateSnapshot(makeSnapshot({ password_policy: null }))
    const score = calculateScore(results)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(100)
  })
})
