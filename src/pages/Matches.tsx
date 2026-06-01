import { useEffect, useState } from 'react'
import { Play, Loader2, HeartHandshake, Sparkles, AlertCircle } from 'lucide-react'
import MatchCard from '@/components/MatchCard'
import { usePostStore } from '@/stores/postStore'

export default function Matches() {
  const { matches, loading, error, fetchMatches, runMatching } = usePostStore()
  const [running, setRunning] = useState(false)

  useEffect(() => {
    fetchMatches()
  }, [])

  const handleRunMatching = async () => {
    setRunning(true)
    try {
      await runMatching()
    } catch {
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-3">
        <div>
          <h1 className="font-['DM_Serif_Display'] text-3xl text-slate-100 max-sm:text-2xl">
            <span className="gradient-text">匹配结果</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">AI智能匹配供给与需求</p>
        </div>
        <button
          onClick={handleRunMatching}
          disabled={running}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50"
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {running ? '正在匹配...' : '运行匹配'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading && !running ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <HeartHandshake className="mb-3 h-16 w-16 text-slate-600" />
          <h3 className="font-['DM_Serif_Display'] text-xl text-slate-400">暂无匹配结果</h3>
          <p className="mt-1 text-sm text-slate-500">点击"运行匹配"按钮让AI开始分析供给与需求的匹配度</p>
          <button
            onClick={handleRunMatching}
            disabled={running}
            className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 px-5 py-2.5 text-sm font-medium text-purple-400 transition-colors hover:from-purple-500/30 hover:to-indigo-500/30"
          >
            <Sparkles className="h-4 w-4" />
            开始智能匹配
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  )
}