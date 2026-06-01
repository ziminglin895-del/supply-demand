import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  trend?: string
  accent?: string
}

export default function StatCard({ icon, label, value, trend, accent }: StatCardProps) {
  const isPositive = trend && !trend.startsWith('-')

  return (
    <div
      className="glass-card glow-border p-5"
      style={accent ? { '--card-accent': accent } as React.CSSProperties : undefined}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: accent ? `${accent}20` : 'rgba(16,185,129,0.12)',
            color: accent || '#10b981',
          }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            )}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </span>
        )}
      </div>

      <p className="number-font text-3xl font-bold tracking-tight text-slate-100">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  )
}