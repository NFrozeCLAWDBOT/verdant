import { useEffect, useState } from 'react'

export function ScoreGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference

  const color = score < 40 ? '#DC2626' : score < 70 ? '#F59E0B' : '#4EC54E'
  const label = score < 40 ? 'Critical' : score < 70 ? 'Needs Work' : 'Healthy'

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="rgba(78, 197, 78, 0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-heading font-bold text-foreground">
            {Math.round(animatedScore)}
          </span>
          <span className="text-sm text-muted-foreground font-body">/100</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-heading font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  )
}
