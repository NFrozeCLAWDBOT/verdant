import { Download } from 'lucide-react'
import type { ScanResult } from '@/types/scan'

export function ExportButton({ scanResult }: { scanResult: ScanResult }) {
  const handleExport = () => {
    const data = JSON.stringify(scanResult, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `verdant-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-emerald-vivid/30 text-emerald-vivid font-heading font-semibold text-sm hover:bg-emerald-vivid/10 transition-all duration-200 cursor-pointer"
    >
      <Download className="h-4 w-4" />
      Export JSON
    </button>
  )
}
