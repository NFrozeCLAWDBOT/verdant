import { useState, useCallback, useEffect } from 'react'
import { HeroSection } from '@/components/hero/HeroSection'
import { HowItWorks } from '@/components/hero/HowItWorks'
import { ScanInterface } from '@/components/scan/ScanInterface'
import { ResultsDashboard } from '@/components/results/ResultsDashboard'
import { PrivacySection } from '@/components/common/PrivacySection'
import { Footer } from '@/components/layout/Footer'
import { evaluateSnapshot, calculateScore } from '@/services/evaluators'
import { saveHistory, getHistory } from '@/services/api'
import { useSessionToken } from '@/hooks/useSessionToken'
import type { AWSSnapshot, ScanResult, HistoryScan } from '@/types/scan'

export default function App() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [sessionToken] = useSessionToken()
  const [historicalScans, setHistoricalScans] = useState<HistoryScan[]>([])
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    if (sessionToken) {
      getHistory(sessionToken).then(setHistoricalScans).catch(() => {})
    }
  }, [sessionToken])

  const handleScanComplete = useCallback(async (snapshot: AWSSnapshot, region: string) => {
    const results = evaluateSnapshot(snapshot)
    const score = calculateScore(results)
    const timestamp = new Date().toISOString()

    const result: ScanResult = { score, results, timestamp, region }
    setScanResult(result)

    try {
      await saveHistory(sessionToken, timestamp, score, results)
      const history = await getHistory(sessionToken)
      setHistoricalScans(history)
    } catch {
      // History save is best-effort
    }

    setTimeout(() => {
      document.getElementById('scan-interface')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
  }, [sessionToken])

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
