import { ChevronDown } from 'lucide-react'
import { FindingItem } from './FindingItem'
import type { CheckResult, Category } from '@/types/scan'

const CATEGORIES: Category[] = [
  'Identity and Access Management',
  'Logging',
  'Monitoring',
  'Networking',
  'Storage',
]

interface FindingsAccordionProps {
  results: CheckResult[]
  expandedCategory: Category | null
  onToggle: (category: Category) => void
}

export function FindingsAccordion({ results, expandedCategory, onToggle }: FindingsAccordionProps) {
  return (
    <div className="space-y-3">
      {CATEGORIES.map((category) => {
        const categoryResults = results.filter(r => r.check.category === category)
        if (categoryResults.length === 0) return null
        const isExpanded = expandedCategory === category
        const failCount = categoryResults.filter(r => r.status === 'fail').length

        return (
          <div key={category} className="glass-panel overflow-hidden">
            <button
              onClick={() => onToggle(category)}
              className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <h3 className="text-base font-heading font-semibold text-foreground">
                  {category}
                </h3>
                {failCount > 0 && (
                  <span className="text-xs bg-danger/20 text-danger px-2 py-0.5 rounded-full">
                    {failCount} failed
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-6 pb-4">
                {categoryResults.map((result) => (
                  <FindingItem key={result.check.id} result={result} />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
