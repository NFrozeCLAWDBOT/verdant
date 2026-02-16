import type { Severity } from '@/types/scan'

const severityStyles: Record<Severity, string> = {
  critical: 'bg-red-600/20 text-red-400 border-red-600/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${severityStyles[severity]}`}>
      {severity}
    </span>
  )
}
