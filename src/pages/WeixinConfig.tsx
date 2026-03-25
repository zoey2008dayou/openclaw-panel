import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ExternalLink, CheckCircle, Loader2, RefreshCw, Info, Smartphone } from 'lucide-react'

interface OpenClawConfig {
  plugins?: {
    entries?: {
      openclaw_weixin?: { enabled: boolean }
    }
  }
}

interface ChannelStatus {
  configured: boolean
  enabled: boolean
}

export default function WeixinConfig() {
  const [config, setConfig] = useState<OpenClawConfig>({})
  const [status, setStatus] = useState<ChannelStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [enabling, setEnabling] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const cfg = await invoke<OpenClawConfig>('read_config')
      setConfig(cfg)
      const enabled = cfg.plugins?.entries?.openclaw_weixin?.enabled ?? false
      setStatus({
        configured: enabled,
        enabled
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const handleEnable = async () => {
    setEnabling(true)
    try {
      const newConfig = {
        ...config,
        plugins: {
          entries: {
            ...config.plugins?.entries,
            openclaw_weixin: { enabled: true }
          }
        }
      }
      await invoke('save_config', { config: newConfig })
      checkStatus()
    } catch (e) {
      alert('启用失败: ' + e)
    } finally {
      setEnabling(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">微信通道配置</h2>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Info className="w-3 h-3" />
          <span>配置格式: OpenClaw 2026.3.13</span>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">微信登录方式</h3>
        <p className="text-sm text-blue-700 mb-2">
          微信通道通过扫码登录获取凭证，无需配置 AppID。
        </p>
        <div className="bg-white rounded-lg p-3 text-sm">
          <p className="text-gray-600 mb-1">在终端执行以下命令登录：</p>
          <code className="text-blue-600 bg-gray-50 px-2 py-1 rounded block">
            openclaw channels login --channel openclaw-weixin
          </code>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : status?.configured ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
              <CheckCircle className="w-6 h-6" />
              <span className="font-medium">微信通道已启用</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              如需重新登录，请在终端运行登录命令
            </p>
            <button
              onClick={checkStatus}
              className="flex items-center gap-2 mx-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新状态
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-orange-500 mb-4">
              <Smartphone className="w-6 h-6" />
              <span className="font-medium">微信通道未启用</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              点击下方按钮启用微信通道，然后在终端执行登录命令
            </p>
            <button
              onClick={handleEnable}
              disabled={enabling}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {enabling ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  启用中...
                </span>
              ) : (
                '启用微信通道'
              )}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
            <strong>配置将保存到:</strong>
            <code className="ml-2 text-blue-600">plugins.entries.openclaw-weixin</code>
          </div>

          <h4 className="font-medium text-gray-700 mb-2">相关链接</h4>
          <div className="flex gap-4">
            <a
              href="https://weixin.qq.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              微信官网 <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://docs.openclaw.ai/channels/weixin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              OpenClaw 文档 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}