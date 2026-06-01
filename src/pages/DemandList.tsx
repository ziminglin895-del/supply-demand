import { useEffect, useState } from 'react'
import { Search, Filter, RotateCcw } from 'lucide-react'
import PostCard from '@/components/PostCard'
import { usePostStore } from '@/stores/postStore'

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待匹配' },
  { value: 'matched', label: '已匹配' },
  { value: 'closed', label: '已关闭' },
]

const cityOptions = [
  { value: '', label: '全部城市' },
  { value: '北京', label: '北京' },
  { value: '上海', label: '上海' },
  { value: '广州', label: '广州' },
  { value: '深圳', label: '深圳' },
  { value: '成都', label: '成都' },
  { value: '杭州', label: '杭州' },
  { value: '武汉', label: '武汉' },
  { value: '南京', label: '南京' },
  { value: '重庆', label: '重庆' },
  { value: '苏州', label: '苏州' },
  { value: '西安', label: '西安' },
  { value: '天津', label: '天津' },
  { value: '长沙', label: '长沙' },
  { value: '郑州', label: '郑州' },
  { value: '青岛', label: '青岛' },
  { value: '厦门', label: '厦门' },
  { value: '东莞', label: '东莞' },
  { value: '宁波', label: '宁波' },
  { value: '佛山', label: '佛山' },
  { value: '合肥', label: '合肥' },
  { value: '无锡', label: '无锡' },
  { value: '昆明', label: '昆明' },
  { value: '济南', label: '济南' },
  { value: '大连', label: '大连' },
  { value: '福州', label: '福州' },
  { value: '沈阳', label: '沈阳' },
  { value: '哈尔滨', label: '哈尔滨' },
  { value: '长春', label: '长春' },
  { value: '石家庄', label: '石家庄' },
  { value: '太原', label: '太原' },
]

export default function DemandList() {
  const { posts, loading, fetchPosts } = usePostStore()
  const [status, setStatus] = useState('')
  const [tag, setTag] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    fetchPosts({ type: 'demand', status: status || undefined, tag: tag || undefined, city: city || undefined })
  }, [status, tag, city])

  const allTags = Array.from(new Set(posts.flatMap((p) => p.aiTags || [])))

  const handleReset = () => {
    setStatus('')
    setTag('')
    setCity('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['DM_Serif_Display'] text-3xl text-slate-100 max-sm:text-2xl">
          <span className="gradient-text-amber">需求大厅</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">浏览所有已发布的需求信息</p>
      </div>

      <div className="glass-card flex flex-wrap items-center gap-3 p-4 max-sm:flex-col max-sm:items-stretch">
        <Filter className="h-4 w-4 text-slate-500" />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 outline-none focus:border-amber-500/50"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {allTags.length > 0 && (
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 outline-none focus:border-amber-500/50"
          >
            <option value="">全部标签</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 outline-none focus:border-amber-500/50"
        >
          {cityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
        >
          <RotateCcw className="h-4 w-4" />
          重置
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-3 h-12 w-12 text-slate-600" />
          <p className="text-slate-500">暂无需求信息</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}