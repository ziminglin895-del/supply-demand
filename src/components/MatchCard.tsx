import { useNavigate } from 'react-router-dom'
import { ArrowRight, Brain, Check, X, Clock, Tag, FileText, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Match } from '@/stores/postStore'
import { usePostStore } from '@/stores/postStore'

interface MatchCardProps {
  match: Match
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

export default function MatchCard({ match }: MatchCardProps) {
  const navigate = useNavigate()
  const updateMatchStatus = usePostStore((s) => s.updateMatchStatus)

  return (
    <div className="glass-card glow-border p-5">
      <div className="flex items-start gap-5 max-md:flex-col">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div
            className={cn(
              'number-font flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl font-bold',
              scoreColor(match.score),
              match.score >= 80
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : match.score >= 60
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : 'border-red-500/30 bg-red-500/10'
            )}
          >
            {match.score}
          </div>
          <span className="text-[10px] text-slate-500">匹配分</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center gap-2 max-md:flex-col max-md:items-start">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/post/${match.supplyPost.id}`)
              }}
              className="min-w-0 flex-1 text-left max-md:w-full"
            >
              <span className="text-xs text-emerald-400">供给</span>
              <p className="font-['DM_Serif_Display'] text-base text-slate-200 truncate">
                {match.supplyPost.title}
              </p>
            </button>

            <ArrowRight className="h-5 w-5 shrink-0 text-slate-600" />

            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/post/${match.demandPost.id}`)
              }}
              className="min-w-0 flex-1 text-right max-md:w-full max-md:text-left"
            >
              <span className="text-xs text-amber-400">需求</span>
              <p className="font-['DM_Serif_Display'] text-base text-slate-200 truncate">
                {match.demandPost.title}
              </p>
            </button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/50 px-2.5 py-1 text-xs">
              <Tag className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-slate-400">IP匹配</span>
              <span className="number-font text-indigo-400">{match.matchDetails.ipMatch}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/50 px-2.5 py-1 text-xs">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400">时间匹配</span>
              <span className="number-font text-cyan-400">{match.matchDetails.timeMatch}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/50 px-2.5 py-1 text-xs">
              <FileText className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-slate-400">内容匹配</span>
              <span className="number-font text-violet-400">{match.matchDetails.contentMatch}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/50 px-2.5 py-1 text-xs">
              <MapPin className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-slate-400">位置匹配</span>
              <span className="number-font text-rose-400">{match.matchDetails.locationScore}</span>
            </div>
          </div>

          <div className="mb-3 flex items-start gap-2 rounded-lg bg-slate-800/30 p-3">
            <Brain className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
            <p className="text-sm leading-relaxed text-slate-400">{match.reason}</p>
          </div>

          {match.distanceKm > 0 && (
            <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              <span>两地相距 {match.distanceKm}km</span>
            </div>
          )}

          {match.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  updateMatchStatus(match.id, 'confirmed')
                }}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
              >
                <Check className="h-4 w-4" />
                确认匹配
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  updateMatchStatus(match.id, 'rejected')
                }}
                className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <X className="h-4 w-4" />
                拒绝
              </button>
            </div>
          )}

          {match.status === 'confirmed' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              <Check className="h-3 w-3" />
              已确认
            </span>
          )}
          {match.status === 'rejected' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400">
              <X className="h-3 w-3" />
              已拒绝
            </span>
          )}
        </div>
      </div>
    </div>
  )
}