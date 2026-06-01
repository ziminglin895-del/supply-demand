import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Send, Loader2, ArrowLeft, CheckCircle, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePostStore } from '@/stores/postStore'

const cities = [
  { name: '北京', lat: 39.9, lng: 116.4 },
  { name: '上海', lat: 31.2, lng: 121.5 },
  { name: '广州', lat: 23.1, lng: 113.3 },
  { name: '深圳', lat: 22.5, lng: 114.1 },
  { name: '成都', lat: 30.6, lng: 104.1 },
  { name: '杭州', lat: 30.3, lng: 120.2 },
  { name: '武汉', lat: 30.6, lng: 114.3 },
  { name: '南京', lat: 32.1, lng: 118.8 },
  { name: '重庆', lat: 29.5, lng: 106.5 },
  { name: '苏州', lat: 31.3, lng: 120.6 },
  { name: '西安', lat: 34.3, lng: 108.9 },
  { name: '天津', lat: 39.1, lng: 117.2 },
  { name: '长沙', lat: 28.2, lng: 112.9 },
  { name: '郑州', lat: 34.7, lng: 113.6 },
  { name: '青岛', lat: 36.1, lng: 120.4 },
  { name: '厦门', lat: 24.5, lng: 118.1 },
  { name: '东莞', lat: 23.0, lng: 113.7 },
  { name: '宁波', lat: 29.9, lng: 121.6 },
  { name: '佛山', lat: 23.0, lng: 113.1 },
  { name: '合肥', lat: 31.8, lng: 117.3 },
  { name: '无锡', lat: 31.5, lng: 120.3 },
  { name: '昆明', lat: 25.0, lng: 102.7 },
  { name: '济南', lat: 36.7, lng: 117.0 },
  { name: '大连', lat: 38.9, lng: 121.6 },
  { name: '福州', lat: 26.1, lng: 119.3 },
  { name: '沈阳', lat: 41.8, lng: 123.4 },
  { name: '哈尔滨', lat: 45.7, lng: 126.6 },
  { name: '长春', lat: 43.9, lng: 125.3 },
  { name: '石家庄', lat: 38.0, lng: 114.5 },
  { name: '太原', lat: 37.9, lng: 112.5 },
]

export default function Publish() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loading, createPost } = usePostStore()

  const initialType = (searchParams.get('type') as 'supply' | 'demand') || 'supply'
  const [type, setType] = useState<'supply' | 'demand'>(initialType)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [contact, setContact] = useState('')
  const [city, setCity] = useState('')
  const [latitude, setLatitude] = useState(0)
  const [longitude, setLongitude] = useState(0)
  const [success, setSuccess] = useState(false)
  const [locating, setLocating] = useState(true)

  useEffect(() => {
    setType(initialType)
  }, [initialType])

  useEffect(() => {
    fetch('/api/location')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.city) {
          const cityName = res.data.city
          const matched = cities.find((c) => c.name === cityName)
          if (matched) {
            setCity(matched.name)
            setLatitude(matched.lat)
            setLongitude(matched.lng)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLocating(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    try {
      await createPost({
        type,
        title: title.trim(),
        content: content.trim(),
        timeStart,
        timeEnd,
        contact: contact.trim(),
        city,
        latitude,
        longitude,
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/matches')
      }, 1500)
    } catch {
    }
  }

  if (success) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="mt-4 font-['DM_Serif_Display'] text-2xl text-slate-200">发布成功</h2>
        <p className="mt-1 text-slate-400">正在跳转到匹配页面...</p>
      </div>
    )
  }

  const accentColor = type === 'supply' ? 'emerald' : 'amber'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <div>
        <h1 className="font-['DM_Serif_Display'] text-3xl text-slate-100 max-sm:text-2xl">
          发布<span className={type === 'supply' ? 'gradient-text-green' : 'gradient-text-amber'}>
            {type === 'supply' ? '供给' : '需求'}
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">填写详细信息，AI将自动分析并匹配</p>
      </div>

      <div className="glass-card p-6 max-sm:p-4">
        <div className="mb-6 flex rounded-xl bg-slate-800/50 p-1">
          <button
            onClick={() => setType('supply')}
            className={cn(
              'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
              type === 'supply'
                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            🔼 供给
          </button>
          <button
            onClick={() => setType('demand')}
            className={cn(
              'flex-1 rounded-lg py-2.5 text-sm font-medium transition-all',
              type === 'demand'
                ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            🔽 需求
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入标题"
              required
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-800/70"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">详细描述</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="详细描述你的供给/需求内容，越详细AI匹配越精准..."
              rows={5}
              required
              className="w-full resize-none rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-800/70"
            />
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              发布后 AI 将自动从内容中抓取 IP 定位信息
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">开始时间</label>
              <input
                type="datetime-local"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-emerald-500/50 focus:bg-slate-800/70"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">结束时间</label>
              <input
                type="datetime-local"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-emerald-500/50 focus:bg-slate-800/70"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">联系方式</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="微信 / 手机 / 邮箱"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-slate-800/70"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">
              <MapPin className="inline h-3.5 w-3.5 mr-1" />
              城市位置
            </label>
            <select
              value={city}
              onChange={(e) => {
                const selected = cities.find((c) => c.name === e.target.value)
                setCity(e.target.value)
                setLatitude(selected?.lat ?? 0)
                setLongitude(selected?.lng ?? 0)
              }}
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-emerald-500/50 focus:bg-slate-800/70"
            >
              <option value="">{locating ? '正在自动定位...' : '不限位置'}</option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">已自动识别你的城市位置，也可以手动修改</p>
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim() || !content.trim()}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 font-medium transition-all',
              type === 'supply'
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-amber-500 text-white hover:bg-amber-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {loading ? '发布中...' : '立即发布'}
          </button>
        </form>
      </div>
    </div>
  )
}