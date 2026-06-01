import { useNavigate } from 'react-router-dom'
import { Clock, Tag, Sparkles, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Post } from '@/stores/postStore'

interface PostCardProps {
  post: Post
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待匹配', className: 'bg-slate-500/20 text-slate-400' },
  matched: { label: '已匹配', className: 'bg-emerald-500/20 text-emerald-400' },
  closed: { label: '已关闭', className: 'bg-red-500/20 text-red-400' },
}

export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate()
  const isSupply = post.type === 'supply'
  const statusInfo = statusMap[post.status] || statusMap.pending

  return (
    <div
      className="glass-card glow-border cursor-pointer p-5"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <div className="mb-3 flex items-center gap-2">
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
        <span className={cn('rounded-full px-2 py-0.5 text-xs', statusInfo.className)}>
          {statusInfo.label}
        </span>
      </div>

      <h3 className="mb-2 font-['DM_Serif_Display'] text-lg text-slate-100 line-clamp-1">
        {post.title}
      </h3>

      {post.ipName && (
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-purple-400" />
          <span className="rounded border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-[11px] text-purple-300">
            {post.ipName}
          </span>
        </div>
      )}

      <p className="mb-3 text-sm leading-relaxed text-slate-400 line-clamp-2">
        {post.content}
      </p>

      {post.aiTags && post.aiTags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Tag className="h-3.5 w-3.5 text-slate-500" />
          {post.aiTags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-700/50 bg-slate-800/50 px-2 py-0.5 text-[11px] text-slate-400"
            >
              {tag}
            </span>
          ))}
          {post.aiTags.length > 4 && (
            <span className="text-[11px] text-slate-500">+{post.aiTags.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock className="h-3.5 w-3.5" />
        <span>
          {post.timeStart ? new Date(post.timeStart).toLocaleDateString('zh-CN') : '—'} ~{' '}
          {post.timeEnd ? new Date(post.timeEnd).toLocaleDateString('zh-CN') : '—'}
        </span>
      </div>

      {post.city && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3 w-3 text-slate-500" />
          <span>{post.city}</span>
        </div>
      )}
    </div>
  )
}