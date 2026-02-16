import { motion } from 'framer-motion'
import { CategoryCard } from './CategoryCard'
import type { CheckResult, Category } from '@/types/scan'

const CATEGORIES: Category[] = [
  'Identity and Access Management',
  'Logging',
  'Monitoring',
  'Networking',
  'Storage',
]

interface CategoryGridProps {
  results: CheckResult[]
  onCategoryClick: (category: Category) => void
}

export function CategoryGrid({ results, onCategoryClick }: CategoryGridProps) {
  const groupedResults = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = results.filter(r => r.check.category === cat)
    return acc
  }, {} as Record<Category, CheckResult[]>)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {CATEGORIES.map((category, i) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <CategoryCard
            category={category}
            results={groupedResults[category]}
            onClick={() => onCategoryClick(category)}
          />
        </motion.div>
      ))}
    </div>
  )
}
