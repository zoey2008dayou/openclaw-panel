import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ExternalLink, CheckCircle, Loader2, RefreshCw, Info, AlertCircle, ChevronDown, ChevronUp, Smartphone, Terminal } from 'lucide-react'

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
  const [expandedStep, setExpandedStep] = useState<number | null>(1)

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

  const steps = [
    {
      title: '启用微信通道',
      content: (
        <div className="space-y-2">
          <p>微信通道通过扫码登录获取凭证，无需在平台创建应用。</p>
          <p>点击左侧「启用微信通道」按钮开启功能。</p>
        </div>
      )
    },
    {
      title: '终端扫码登录',
      content: (
        <div className="space-y-2">
          <p>在终端执行登录命令：</p>
          <div className="bg-gray-800 text-green-400 p-2 rounded font-mono text-sm">
            openclaw channels login --channel openclaw-weixin
          </div>
          <p>终端会显示二维码，使用微信扫码确认登录。</p>
        </div>
      )
    },
    {
      title: '登录凭证存储',
      content: (
        <div className="space-y-2">
          <p>登录成功后，凭证会自动保存到：</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li><code>~/.openclaw/openclaw.json</code> - 配置文件</li>
            <li><code>~/.openclaw/credentials/</code> - 凭证文件</li>
          </ul>
          <p className="text-orange-600 text-sm mt-2">⚠️ 凭证文件包含敏感信息，请勿泄露！</p>
        </div>
      )
    },
    {
      title: '启动 Gateway',
      content: (
        <div className="space-y-2">
          <p>登录成功后，在 Gateway 页面启动服务：</p>
          <div className="bg-gray-800 text-green-400 p-2 rounded font-mono text-sm">
            openclaw gateway start
          </div>
          <p>或在 Panel 的 Gateway 页面点击「启动」按钮。</p>
        </div>
      )
    }
  ]

  const limitations = [
    { title: '消息接收', value: '支持私聊和群聊消息' },
    { title: '消息发送', value: '支持文本、图片、文件' },
    { title: '登录有效期', value: '约 7-14 天，过期需重新登录' },
    { title: '适用场景', value: '个人使用、测试开发' },
  ]

  return (
    <div className="flex gap-6 max-w-5xl">
      {/* 左侧：配置区域 */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">微信通道配置</h2>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Info className="w-3 h-3" />
            <span>配置格式: OpenClaw 2026.3.13</span>
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
                如需重新登录，请在终端运行：<br />
                <code className="bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  openclaw channels login --channel openclaw-weixin
                </code>
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
          </div>
        </div>

        {/* 功能限制说明 */}
        <div className="mt-4 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            微信个人号限制
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {limitations.map(({ title, value }) => (
              <div key={title} className="bg-white rounded-lg p-2">
                <span className="text-gray-500">{title}:</span>
                <span className="ml-1 text-gray-700">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            微信个人号登录为非官方接口，请勿用于商业用途。
          </p>
        </div>
      </div>

      {/* 右侧：配置指南 */}
      <div className="w-80">
        <div className="bg-gray-50 rounded-xl p-4 sticky top-4">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            配置指南
          </h3>
          
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                  className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <span className="font-medium text-sm text-gray-700">
                    步骤 {index + 1}: {step.title}
                  </span>
                  {expandedStep === index ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedStep === index && (
                  <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-100">
                    {step.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 space-y-1">
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
              OpenClaw 微信配置文档 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}