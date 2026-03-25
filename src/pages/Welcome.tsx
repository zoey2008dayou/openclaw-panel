import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useNavigate } from 'react-router-dom'
import { Zap, CheckCircle, AlertCircle, Loader2, Download, AlertTriangle } from 'lucide-react'

interface OpenClawInfo {
  installed: boolean
  version?: string
  path?: string
}

const MIN_VERSION = '2026.3.1'
const COMPATIBLE_VERSION = '2026.3.13'

export default function Welcome() {
  const navigate = useNavigate()
  const [info, setInfo] = useState<OpenClawInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [installResult, setInstallResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkInstall = () => {
    setLoading(true)
    setError(null)
    invoke<OpenClawInfo>('check_openclaw_installed')
      .then(setInfo)
      .catch(e => setError(e.toString()))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    checkInstall()
  }, [])

  const handleInstall = async () => {
    setInstalling(true)
    setInstallResult(null)
    try {
      const result = await invoke<string>('install_openclaw')
      setInstallResult({ success: true, message: result })
      setTimeout(checkInstall, 1000)
    } catch (e: unknown) {
      setInstallResult({ success: false, message: e instanceof Error ? e.message : String(e) })
    } finally {
      setInstalling(false)
    }
  }

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
    if (!info?.version) return { status: 'error', message: '' }
    const version = info.version.replace(/^v/, '')
    if (compareVersion(version, MIN_VERSION) < 0) {
      return { status: 'error', message: `版本过低，需要 ${MIN_VERSION} 或更高` }
    }
    if (compareVersion(version, COMPATIBLE_VERSION) >= 0) {
      return { status: 'ok', message: '配置完全兼容' }
    }
    return { status: 'warning', message: '建议更新到最新版本以获得完整支持' }
  }

  const compat = info ? getCompatibility() : { status: 'error', message: '' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">OpenClaw Panel</h1>
        <p className="text-sm text-gray-400 mb-4">配置管理工具 v0.1.3</p>
        
        {loading && (
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>正在检测环境...</span>
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
              <span className="font-medium">OpenClaw {info.version}</span>
            </div>
            
            {/* 兼容性状态 */}
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              compat.status === 'ok' ? 'bg-green-50 text-green-700' :
              compat.status === 'warning' ? 'bg-yellow-50 text-yellow-700' :
              'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center justify-center gap-2">
                {compat.status === 'ok' && <CheckCircle className="w-4 h-4" />}
                {compat.status === 'warning' && <AlertTriangle className="w-4 h-4" />}
                {compat.status === 'error' && <AlertCircle className="w-4 h-4" />}
                <span>{compat.message}</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mb-1 break-all">{info.path}</p>
            <p className="text-xs text-gray-400 mb-6">
              配置格式适配: OpenClaw {COMPATIBLE_VERSION}
            </p>
            
            <button
              onClick={() => navigate('/app/model')}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

            {installResult && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                installResult.success 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {installResult.message}
              </div>
            )}

            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mb-4"
            >
              {installing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>正在安装...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>一键安装 OpenClaw</span>
                </>
              )}
            </button>

            <div className="text-sm text-gray-400 mb-4">或手动安装：</div>
            <code className="block bg-gray-100 rounded-lg p-3 text-sm mb-6 text-left overflow-x-auto">
              npm install -g openclaw
            </code>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={checkInstall}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                重新检测
              </button>
              <button
                onClick={() => navigate('/app/model')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                稍后配置
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}