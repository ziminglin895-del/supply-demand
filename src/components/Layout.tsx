import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'

export default function Layout() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="ml-60 flex-1 overflow-y-auto p-6 max-lg:ml-16 max-sm:p-4">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}