import type { AWSSnapshot, HistoryScan, CheckResult } from '@/types/scan'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function scanOnline(
  accessKeyId: string,
  secretAccessKey: string,
  region: string
): Promise<{ snapshot: AWSSnapshot; timestamp: string; region: string }> {
  const res = await fetch(`${API_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessKeyId, secretAccessKey, region }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Scan failed')
  }

  return data
}

export async function saveHistory(
  sessionToken: string,
  timestamp: string,
  score: number,
  results: CheckResult[]
): Promise<void> {
  await fetch(`${API_URL}/api/history/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken, timestamp, score, results }),
  })
}

export async function getHistory(sessionToken: string): Promise<HistoryScan[]> {
  const res = await fetch(`${API_URL}/api/history/${sessionToken}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.scans || []
}
