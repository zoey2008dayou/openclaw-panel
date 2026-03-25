import { NavLink } from 'react-router-dom'
import { Cpu, MessageCircle, Server } from 'lucide-react'

const navItems = [
  { to: '/app/model', icon: Cpu, label: '模型配置' },
  { to: '/app/feishu', icon: MessageCircle, label: '飞书通道' },
  { to: '/app/gateway', icon: Server, label: 'Gateway' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-800">OpenClaw Panel</h1>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
        v0.1.0
      </div>
    </aside>
  )
}