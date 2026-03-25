import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useNavigate } from 'react-router-dom'
import { Zap, CheckCircle, AlertCircle, Loader2, Download, AlertTriangle, Package } from 'lucide-react'

interface OpenClawInfo {
  installed: boolean
  version?: string
  path?: string
}

interface DependencyStatus {
  node_installed: boolean
  node_version?: string
  pnpm_installed: boolean
  npm_installed: boolean
  yarn_installed: boolean
  recommended_manager: string
}

interface InstallResult {
  success: boolean
  message: string
  version?: string
}

const MIN_VERSION = '2026.3.1'
const COMPATIBLE_VERSION = '2026.3.13'

export default function Welcome() {
  const navigate = useNavigate()
  const [info, setInfo] = useState<OpenClawInfo | null>(null)
  const [deps, setDeps] = useState<DependencyStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<'pnpm' | 'openclaw' | null>(null)
  const [installResult, setInstallResult] = useState<InstallResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [infoResult, depsResult] = await Promise.all([
        invoke<OpenClawInfo>('check_openclaw_installed'),
        invoke<DependencyStatus>('check_dependencies'),
      ])
      setInfo(infoResult)
      setDeps(depsResult)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAll()
  }, [])

  const handleInstallPnpm = async () => {
    setInstalling('pnpm')
    setInstallResult(null)
    try {
      const result = await invoke<InstallResult>('install_pnpm')
      setInstallResult(result)
      if (result.success) {
        await checkAll()
      }
    } catch (e: unknown) {
      setInstallResult({ success: false, message: e instanceof Error ? e.message : String(e) })
    } finally {
      setInstalling(null)
    }
  }

  const handleInstallOpenClaw = async () => {
    setInstalling('openclaw')
    setInstallResult(null)
    try {
      const result = await invoke<InstallResult>('install_openclaw')
      setInstallResult(result)
      if (result.success) {
        await checkAll()
      }
    } catch (e: unknown) {
      setInstallResult({ success: false, message: e instanceof Error ? e.message : String(e) })
    } finally {
      setInstalling(null)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">OpenClaw Panel</h1>
        <p className="text-sm text-gray-400 mb-6">配置管理工具 v0.1.7</p>
        
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

        {/* 安装结果 */}
        {installResult && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-left ${
            installResult.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {installResult.success ? (
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              <span>{installResult.message}</span>
            </div>
          </div>
        )}
        
        {/* OpenClaw 已安装 */}
        {info?.installed && (
          <>
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">OpenClaw {info.version}</span>
            </div>
            
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
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              进入配置
            </button>
          </>
        )}
        
        {/* OpenClaw 未安装 */}
        {info && !info.installed && deps && (
          <>
            <div className="flex items-center justify-center gap-2 text-orange-500 mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>未检测到 OpenClaw</span>
            </div>

            {/* 依赖状态 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                环境检测
              </h3>
              
              <div className="space-y-2 text-sm">
                {/* Node.js */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Node.js</span>
                  {deps.node_installed ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {deps.node_version}
                    </span>
                  ) : (
                    <span className="text-red-500">未安装</span>
                  )}
                </div>
                
                {/* 包管理器 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">包管理器</span>
                  <div className="flex gap-2 text-xs">
                    {deps.pnpm_installed && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">pnpm ✓</span>
                    )}
                    {deps.npm_installed && !deps.pnpm_installed && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">npm ✓</span>
                    )}
                    {deps.yarn_installed && !deps.pnpm_installed && !deps.npm_installed && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">yarn ✓</span>
                    )}
                    {!deps.pnpm_installed && !deps.npm_installed && !deps.yarn_installed && (
                      <span className="text-red-500">未安装</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 缺少 Node.js */}
            {!deps.node_installed && (
              <div className="bg-red-50 rounded-lg p-4 mb-4 text-sm text-red-700">
                <p className="font-medium mb-2">请先安装 Node.js</p>
                <a
                  href="https://nodejs.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://nodejs.org/
                </a>
              </div>
            )}

            {/* 缺少包管理器 - 提供安装 pnpm */}
            {deps.node_installed && !deps.pnpm_installed && !deps.npm_installed && !deps.yarn_installed && (
              <button
                onClick={handleInstallPnpm}
                disabled={installing !== null}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mb-3"
              >
                {installing === 'pnpm' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>正在安装 pnpm...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>安装 pnpm (推荐)</span>
                  </>
                )}
              </button>
            )}

            {/* 可以安装 OpenClaw */}
            {deps.node_installed && (deps.pnpm_installed || deps.npm_installed || deps.yarn_installed) && (
              <button
                onClick={handleInstallOpenClaw}
                disabled={installing !== null}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mb-3"
              >
                {installing === 'openclaw' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>正在安装 OpenClaw...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>一键安装 OpenClaw</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">或</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <code className="block bg-gray-100 rounded-lg p-3 text-sm mb-6 text-left overflow-x-auto">
              {deps.recommended_manager !== 'none' 
                ? `${deps.recommended_manager} install -g openclaw`
                : 'npm install -g openclaw'}
            </code>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={checkAll}
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