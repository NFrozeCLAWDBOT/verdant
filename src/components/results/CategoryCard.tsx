import type { CheckResult, Category } from '@/types/scan'
import { Shield, FileText, Eye, Globe, HardDrive } from 'lucide-react'

const categoryIcons: Record<Category, React.ReactNode> = {
  'Identity and Access Management': <Shield className="h-5 w-5" />,
  'Logging': <FileText className="h-5 w-5" />,
  'Monitoring': <Eye className="h-5 w-5" />,
  'Networking': <Globe className="h-5 w-5" />,
  'Storage': <HardDrive className="h-5 w-5" />,
}

const categoryShortNames: Record<Category, string> = {
  'Identity and Access Management': 'IAM',
  'Logging': 'Logging',
  'Monitoring': 'Monitoring',
  'Networking': 'Networking',
  'Storage': 'Storage',
}

interface CategoryCardProps {
  category: Category
  results: CheckResult[]
  onClick: () => void
}

export function CategoryCard({ category, results, onClick }: CategoryCardProps) {
  const passCount = results.filter(r => r.status === 'pass').length
  const total = results.length
  const percentage = total > 0 ? (passCount / total) * 100 : 0
  const barColor = percentage < 40 ? 'bg-danger' : percentage < 70 ? 'bg-warning' : 'bg-emerald-vivid'

  return (
    <button
      onClick={onClick}
      className="glass-panel glass-panel-hover p-6 text-left transition-all duration-300 cursor-pointer w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="text-emerald-vivid">{categoryIcons[category]}</div>
        <h3 className="text-lg font-heading font-semibold text-foreground">
          {categoryShortNames[category]}
        </h3>
      </div>

      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground font-body">
          {passCount}/{total} passed
        </span>
        <span className="text-foreground font-heading font-semibold">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-emerald-vivid/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  )
}
