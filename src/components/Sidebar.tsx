import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Cpu, MessageCircle, Server, CheckCircle, AlertCircle, Smartphone } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

interface OpenClawInfo {
  installed: boolean
  version?: string
  path?: string
}

const navItems = [
  { to: '/app/model', icon: Cpu, label: '模型配置' },
  { to: '/app/feishu', icon: MessageCircle, label: '飞书通道' },
  { to: '/app/qqbot', icon: MessageCircle, label: 'QQ Bot' },
  { to: '/app/weixin', icon: Smartphone, label: '微信通道' },
  { to: '/app/gateway', icon: Server, label: 'Gateway' },
]

const MIN_VERSION = '2026.3.1'
const COMPATIBLE_VERSION = '2026.3.13'

export default function Sidebar() {
  const [info, setInfo] = useState<OpenClawInfo | null>(null)

  useEffect(() => {
    invoke<OpenClawInfo>('check_openclaw_installed').then(setInfo)
  }, [])

  const compareVersion = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0
      if (p1 > p2) return 1
      if (p1 < p2) return -1
    }
    return 0
  }

  const getCompatibility = () => {
    if (!info?.installed || !info.version) {
      return { status: 'error', message: '未安装 OpenClaw' }
    }
    const version = info.version.replace(/^v/, '')
    if (compareVersion(version, MIN_VERSION) < 0) {
      return { status: 'warning', message: `版本过低，需要 ${MIN_VERSION}+` }
    }
    if (compareVersion(version, COMPATIBLE_VERSION) >= 0) {
      return { status: 'ok', message: '完全兼容' }
    }
    return { status: 'warning', message: '建议更新到最新版' }
  }

  const compat = getCompatibility()

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-800">OpenClaw Panel</h1>
        <p className="text-xs text-gray-400 mt-1">配置管理工具</p>
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

      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="text-xs text-gray-400">
          Panel v0.1.7
        </div>
        
        {info ? (
          <div className={`text-xs p-2 rounded-lg ${
            compat.status === 'ok' ? 'bg-green-50 text-green-700' :
            compat.status === 'warning' ? 'bg-yellow-50 text-yellow-700' :
            'bg-red-50 text-red-700'
          }`}>
            <div className="flex items-center gap-1 font-medium">
              {compat.status === 'ok' ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              <span>OpenClaw {info.version || '未安装'}</span>
            </div>
            <div className="mt-0.5 opacity-75">{compat.message}</div>
          </div>
        ) : (
          <div className="text-xs text-gray-400">检测中...</div>
        )}
        
        <div className="text-xs text-gray-400">
          配置格式: OpenClaw 2026.3.13
        </div>
      </div>
    </aside>
  )
}