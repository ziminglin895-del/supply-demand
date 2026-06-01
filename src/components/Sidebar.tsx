import { NavLink } from 'react-router-dom'
import {
  Home,
  Package,
  Search,
  PlusCircle,
  HeartHandshake,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/supply', label: '供给大厅', icon: Package },
  { to: '/demand', label: '需求大厅', icon: Search },
  { to: '/publish', label: '发布信息', icon: PlusCircle },
  { to: '/matches', label: '匹配结果', icon: HeartHandshake },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col border-r border-slate-800/50 bg-[#0f172a] max-lg:w-16">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/50 px-5 max-lg:justify-center max-lg:px-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20">
          <Zap className="h-5 w-5 text-emerald-400" />
        </div>
        <span className="font-['DM_Serif_Display'] text-xl tracking-wide max-lg:hidden">
          <span className="gradient-text">需求撮合</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 max-lg:px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 max-lg:justify-center max-lg:px-0',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400 -ml-[14px] pl-[18px]'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent -ml-[14px] pl-[18px]'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="max-lg:hidden">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800/50 px-5 py-4 max-lg:px-2 max-lg:text-center">
        <p className="text-xs text-slate-600 max-lg:hidden">
          DeepSeek 智能匹配 v1.0
        </p>
        <p className="text-[10px] text-slate-700 max-lg:block lg:hidden">v1.0</p>
      </div>
    </aside>
  )
}