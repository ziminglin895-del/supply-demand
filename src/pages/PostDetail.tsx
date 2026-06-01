import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Tag, Brain, Calendar, Contact, Loader2, Trash2, AlertCircle, Sparkles, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import MatchCard from '@/components/MatchCard'
import { usePostStore, type Post, type Match } from '@/stores/postStore'

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待匹配', className: 'bg-slate-500/20 text-slate-400' },
  matched: { label: '已匹配', className: 'bg-emerald-500/20 text-emerald-400' },
  closed: { label: '已关闭', className: 'bg-red-500/20 text-red-400' },
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { fetchPost, fetchMatches, matches, loading, error, deletePost } = usePostStore()
  const [post, setPost] = useState<Post | null>(null)

  useEffect(() => {
    if (!id) return
    fetchPost(id).then(setPost)
    fetchMatches()
  }, [id])

  const relatedMatches = matches.filter(
    (m: Match) => m.supplyPost.id === id || m.demandPost.id === id
  )

  const isSupply = post?.type === 'supply'
  const statusInfo = post ? statusMap[post.status] || statusMap.pending : null

  const handleDelete = async () => {
    if (!post) return
    if (!window.confirm('确认删除这条发布信息吗？此操作不可恢复。')) return
    try {
      await deletePost(post.id)
      navigate(-1)
    } catch {
    }
  }

  if (loading && !post) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="mb-3 h-12 w-12 text-slate-600" />
        <p className="text-slate-500">未找到该信息</p>
        <button
          onClick={() => navigate('/')}
          className="mt-3 text-sm text-emerald-400 hover:text-emerald-300"
        >
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
        <div className="col-span-2 space-y-6">
          <div className="glass-card p-6 max-sm:p-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  isSupply
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                )}
              >
                {isSupply ? '供给' : '需求'}
              </span>
              {statusInfo && (
                <span className={cn('rounded-full px-2 py-0.5 text-xs', statusInfo.className)}>
                  {statusInfo.label}
                </span>
              )}
            </div>

            <h1 className="font-['DM_Serif_Display'] text-3xl text-slate-100 max-sm:text-2xl">
              {post.title}
            </h1>

            {post.ipName && (
              <div className="mt-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="rounded border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300">
                  AI 抓取定位
                </span>
                <span className="text-sm text-slate-300">{post.ipName}</span>
              </div>
            )}

            <div className="mt-6 rounded-xl bg-slate-800/40 p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {post.content}
              </p>
            </div>

            {post.contact && (
              <div className="mt-4 flex items-center gap-2">
                <Contact className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-400">{post.contact}</span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                删除
              </button>
            </div>
          </div>

          {post.aiSummary && (
            <div className="glass-card p-6 max-sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <h3 className="font-['DM_Serif_Display'] text-lg text-purple-400">AI 分析</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">{post.aiSummary}</p>
            </div>
          )}

          {post.aiTags && post.aiTags.length > 0 && (
            <div className="glass-card p-6 max-sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <Tag className="h-5 w-5 text-indigo-400" />
                <h3 className="font-['DM_Serif_Display'] text-lg text-indigo-400">AI 标签</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.aiTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-xs text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-['DM_Serif_Display'] text-lg text-slate-300">
              <Calendar className="h-4 w-4 text-slate-500" />
              时间窗口
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">开始时间</p>
                <p className="mt-1 number-font text-sm text-slate-300">
                  {post.timeStart ? new Date(post.timeStart).toLocaleString('zh-CN') : '未指定'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">结束时间</p>
                <p className="mt-1 number-font text-sm text-slate-300">
                  {post.timeEnd ? new Date(post.timeEnd).toLocaleString('zh-CN') : '未指定'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">发布时间</p>
                <p className="mt-1 number-font text-sm text-slate-300">
                  {post.createdAt ? new Date(post.createdAt).toLocaleString('zh-CN') : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-['DM_Serif_Display'] text-lg text-slate-300">
              <Clock className="h-4 w-4 text-slate-500" />
              基本信息
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">类型</span>
                <span className={isSupply ? 'text-emerald-400' : 'text-amber-400'}>
                  {isSupply ? '供给' : '需求'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">状态</span>
                <span>{statusInfo?.label}</span>
              </div>
              {post.city && (
                <div className="flex justify-between">
                  <span className="text-slate-500">位置</span>
                  <span className="text-slate-300">
                    {post.city}
                    {post.latitude !== 0 && post.longitude !== 0 && (
                      <span className="text-slate-500"> ({post.latitude}, {post.longitude})</span>
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">ID</span>
                <span className="number-font text-xs text-slate-500">{post.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedMatches.length > 0 && (
        <div>
          <h3 className="mb-4 font-['DM_Serif_Display'] text-xl text-slate-300">关联匹配</h3>
          <div className="space-y-4">
            {relatedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}