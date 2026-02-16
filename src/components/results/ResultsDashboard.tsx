import { useState } from 'react'
import { motion } from 'framer-motion'
import { ScoreGauge } from './ScoreGauge'
import { SessionToken } from './SessionToken'
import { CategoryGrid } from './CategoryGrid'
import { FindingsAccordion } from './FindingsAccordion'
import { TrendChart } from './TrendChart'
import { ExportButton } from './ExportButton'
import type { ScanResult, Category, HistoryScan } from '@/types/scan'

interface ResultsDashboardProps {
  scanResult: ScanResult
  sessionToken: string
  historicalScans: HistoryScan[]
}

export function ResultsDashboard({ scanResult, sessionToken, historicalScans }: ResultsDashboardProps) {
  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null)

  const handleCategoryClick = (category: Category) => {
    setExpandedCategory(prev => prev === category ? null : category)
    setTimeout(() => {
      document.getElementById('findings')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-16 px-4 md:px-8"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="glass-panel p-8 flex flex-col md:flex-row items-center gap-8">
          <ScoreGauge score={scanResult.score} />
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
              Security Posture Score
            </h2>
            <p className="text-muted-foreground font-body mb-4">
              Scanned {scanResult.results.length} CIS Benchmark checks across 5 categories
            </p>
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <SessionToken token={sessionToken} />
              <ExportButton scanResult={scanResult} />
            </div>
          </div>
        </div>

        <CategoryGrid results={scanResult.results} onCategoryClick={handleCategoryClick} />

        <div id="findings">
          <FindingsAccordion
            results={scanResult.results}
            expandedCategory={expandedCategory}
            onToggle={(cat) => setExpandedCategory(prev => prev === cat ? null : cat)}
          />
        </div>

        <TrendChart scans={historicalScans} />
      </div>
    </motion.section>
  )
}
