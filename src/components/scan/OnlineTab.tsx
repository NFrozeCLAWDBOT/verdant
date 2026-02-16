import { useState } from 'react'
import { Loader2, Scan } from 'lucide-react'
import type { AWSSnapshot } from '@/types/scan'
import { scanOnline } from '@/services/api'

interface OnlineTabProps {
  onScanComplete: (snapshot: AWSSnapshot, region: string) => void
  isScanning: boolean
  setIsScanning: (v: boolean) => void
}

const REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
]

export function OnlineTab({ onScanComplete, isScanning, setIsScanning }: OnlineTabProps) {
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [region, setRegion] = useState('eu-west-2')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsScanning(true)

    try {
      const data = await scanOnline(accessKeyId, secretAccessKey, region)
      onScanComplete(data.snapshot, data.region)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setIsScanning(false)
      setAccessKeyId('')
      setSecretAccessKey('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-muted-foreground text-sm font-body">
        Provide read-only IAM credentials. They are never stored or logged — they exist only in Lambda memory during the scan.
      </p>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Access Key ID</label>
        <input
          type="text"
          value={accessKeyId}
          onChange={(e) => setAccessKeyId(e.target.value)}
          placeholder="AKIA..."
          required
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-emerald-vivid/15 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-vivid/50 focus:ring-1 focus:ring-emerald-vivid/30 font-mono text-sm transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Secret Access Key</label>
        <input
          type="password"
          value={secretAccessKey}
          onChange={(e) => setSecretAccessKey(e.target.value)}
          placeholder="••••••••••••••••"
          required
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-emerald-vivid/15 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-vivid/50 focus:ring-1 focus:ring-emerald-vivid/30 font-mono text-sm transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Region</label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-emerald-vivid/15 text-foreground focus:outline-none focus:border-emerald-vivid/50 focus:ring-1 focus:ring-emerald-vivid/30 font-body text-sm transition-all"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-danger text-sm font-body">{error}</p>
      )}

      <button
        type="submit"
        disabled={isScanning}
        className="w-full gradient-cta py-3 rounded-xl text-foreground font-heading font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {isScanning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Scan className="h-5 w-5" />
            Run Scan
          </>
        )}
      </button>
    </form>
  )
}
