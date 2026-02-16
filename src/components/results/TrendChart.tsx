import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { HistoryScan } from '@/types/scan'

export function TrendChart({ scans }: { scans: HistoryScan[] }) {
  if (scans.length < 2) return null

  const data = scans.map(s => ({
    date: new Date(s.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    score: s.score,
  }))

  return (
    <div className="glass-panel p-6">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
        Posture Trend
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(78, 197, 78, 0.1)" />
          <XAxis dataKey="date" tick={{ fill: '#A8C4A8', fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#A8C4A8', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: 'rgba(10, 15, 10, 0.9)',
              border: '1px solid rgba(78, 197, 78, 0.3)',
              borderRadius: '8px',
              color: '#E8F5E8',
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#4EC54E"
            strokeWidth={2}
            dot={{ fill: '#4EC54E', r: 4 }}
            activeDot={{ r: 6, fill: '#7EE87E' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
