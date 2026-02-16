import { useState, useCallback } from 'react'
import { HeroSection } from '@/components/hero/HeroSection'
import { HowItWorks } from '@/components/hero/HowItWorks'
import { ScanInterface } from '@/components/scan/ScanInterface'
import { ResultsDashboard } from '@/components/results/ResultsDashboard'
import { PrivacySection } from '@/components/common/PrivacySection'
import { Footer } from '@/components/layout/Footer'
import type { AWSSnapshot, ScanResult, HistoryScan } from '@/types/scan'

export default function App() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [sessionToken, setSessionToken] = useState(() => {
    const stored = localStorage.getItem('verdant-session-token')
    return stored || crypto.randomUUID()
  })
  const [historicalScans, setHistoricalScans] = useState<HistoryScan[]>([])
  const [isScanning, setIsScanning] = useState(false)

  const handleScanComplete = useCallback((_snapshot: AWSSnapshot, _region: string) => {
    // Evaluator + scoring logic will be wired in Phase 5
    setScanResult(null)
    setSessionToken(prev => prev)
    setHistoricalScans([])
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <HowItWorks />
      <ScanInterface
        onScanComplete={handleScanComplete}
        isScanning={isScanning}
        setIsScanning={setIsScanning}
      />
      {scanResult && (
        <ResultsDashboard
          scanResult={scanResult}
          sessionToken={sessionToken}
          historicalScans={historicalScans}
        />
      )}
      <PrivacySection />
      <Footer />
    </div>
  )
}
