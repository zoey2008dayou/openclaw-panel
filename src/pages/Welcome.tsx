import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useNavigate } from 'react-router-dom'
import { Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface OpenClawInfo {
  installed: boolean
  version?: string
  path?: string
}

export default function Welcome() {
  const navigate = useNavigate()
  const [info, setInfo] = useState<OpenClawInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    invoke<OpenClawInfo>('check_openclaw_installed')
      .then(setInfo)
      .catch(e => setError(e.toString()))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">OpenClaw Panel</h1>
        
        {loading && (
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>正在检测...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center gap-2 text-red-500 mb-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        
        {info?.installed && (
          <>
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span>OpenClaw 已安装</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">版本: {info.version}</p>
            <p className="text-xs text-gray-400 mb-6">{info.path}</p>
            <button
              onClick={() => navigate('/app/model')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              进入配置
            </button>
          </>
        )}
        
        {info && !info.installed && (
          <>
            <div className="flex items-center justify-center gap-2 text-orange-500 mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>未检测到 OpenClaw</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">请先安装 OpenClaw：</p>
            <code className="block bg-gray-100 rounded-lg p-3 text-sm mb-6 text-left">
              npm install -g openclaw
            </code>
            <button
              onClick={() => navigate('/app/model')}
              className="px-6 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
            >
              稍后配置
            </button>
          </>
        )}
      </div>
    </div>
  )
}