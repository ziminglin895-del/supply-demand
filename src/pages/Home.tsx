import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Search, TrendingUp, Target, ArrowRight, Plus, Sparkles } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { usePostStore } from '@/stores/postStore'

export default function Home() {
  const { stats, posts, loading, fetchStats, fetchPosts } = usePostStore()

  useEffect(() => {
    fetchStats()
    fetchPosts()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['DM_Serif_Display'] text-4xl text-slate-100 max-sm:text-3xl">
            <span className="gradient-text">需求撮合</span> 平台
          </h1>
          <p className="mt-1 text-slate-400">基于 DeepSeek AI 的智能供需匹配系统</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="供给总数"
          value={stats?.totalSupply ?? '—'}
          trend="+12%"
          accent="#10b981"
        />
        <StatCard
          icon={<Search className="h-5 w-5" />}
          label="需求总数"
          value={stats?.totalDemand ?? '—'}
          trend="+8%"
          accent="#f59e0b"
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="匹配成功"
          value={stats?.totalMatched ?? '—'}
          accent="#6366f1"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="匹配率"
          value={stats?.matchRate != null ? `${stats.matchRate}%` : '—'}
          trend="+5%"
          accent="#06b6d4"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <Link
          to="/publish?type=supply"
          className="glass-card glow-border group flex items-center gap-4 p-6 transition-all hover:border-emerald-500/30"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 transition-transform group-hover:scale-110">
            <Plus className="h-7 w-7 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-['DM_Serif_Display'] text-xl text-emerald-400">发布供给</h3>
            <p className="text-sm text-slate-400">分享可授权的IP资源，让匹配更精准</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/publish?type=demand"
          className="glass-card glow-border group flex items-center gap-4 p-6 transition-all hover:border-amber-500/30"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 transition-transform group-hover:scale-110">
            <Plus className="h-7 w-7 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-['DM_Serif_Display'] text-xl text-amber-400">发布需求</h3>
            <p className="text-sm text-slate-400">描述你的IP需求，AI智能匹配供给</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h2 className="font-['DM_Serif_Display'] text-2xl text-slate-200">最近发布</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 h-12 w-12 text-slate-600" />
            <p className="text-slate-500">暂无发布内容</p>
            <Link
              to="/publish"
              className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-4 py-2 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/25"
            >
              <Plus className="h-4 w-4" />
              立即发布
            </Link>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-emerald-500/30 via-slate-700/30 to-transparent max-md:hidden" />
            <div className="space-y-6">
              {posts.slice(0, 8).map((post, index) => {
                const isLeft = index % 2 === 0
                const isSupply = post.type === 'supply'

                return (
                  <div key={post.id} className={`flex items-start gap-6 max-md:flex-col max-md:gap-3 ${isLeft ? '' : 'flex-row-reverse'}`}>
                    <div className={`flex-1 max-md:w-full ${isLeft ? 'text-right' : 'text-left'} max-md:text-left`}>
                      <Link
                        to={`/post/${post.id}`}
                        className="glass-card glow-border inline-block w-full max-w-md p-4 text-left transition-all hover:border-emerald-500/20 max-md:max-w-full"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isSupply ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {isSupply ? '供给' : '需求'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('zh-CN') : ''}
                          </span>
                        </div>
                        <h4 className="font-['DM_Serif_Display'] text-base text-slate-200 line-clamp-1">{post.title}</h4>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{post.content}</p>
                      </Link>
                    </div>

                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 max-md:hidden">
                      <div className={`h-2.5 w-2.5 rounded-full ${isSupply ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    </div>

                    <div className={`flex-1 max-md:w-full ${isLeft ? 'text-left' : 'text-right'} max-md:text-left ${!isLeft ? 'max-md:hidden' : ''}`}>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}