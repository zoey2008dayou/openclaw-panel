import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ExternalLink, CheckCircle, Loader2, Save, Info, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface OpenClawConfig {
  channels?: {
    feishu?: {
      enabled: boolean
      app_id?: string
      app_secret?: string
    }
  }
  plugins?: {
    entries?: {
      feishu?: { enabled: boolean }
    }
  }
}

export default function FeishuConfig() {
  const [config, setConfig] = useState<OpenClawConfig>({})
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedStep, setExpandedStep] = useState<number | null>(1)

  useEffect(() => {
    invoke<OpenClawConfig>('read_config').then(cfg => {
      setConfig(cfg)
      if (cfg.channels?.feishu) {
        setAppId(cfg.channels.feishu.app_id || '')
        setAppSecret(cfg.channels.feishu.app_secret || '')
      }
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const newConfig = {
        ...config,
        channels: {
          ...config.channels,
          feishu: {
            enabled: true,
            app_id: appId,
            app_secret: appSecret,
          }
        },
        plugins: {
          entries: {
            ...config.plugins?.entries,
            feishu: { enabled: true }
          }
        }
      }
      await invoke('save_config', { config: newConfig })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      alert('保存失败: ' + e)
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    {
      title: '创建飞书应用',
      content: (
        <div className="space-y-2">
          <p>1. 访问 <a href="https://open.feishu.cn/app" target="_blank" className="text-blue-600 hover:underline">飞书开放平台</a></p>
          <p>2. 点击「创建企业自建应用」</p>
          <p>3. 填写应用名称、描述、上传图标</p>
          <p>4. 创建后获取 <strong>App ID</strong> 和 <strong>App Secret</strong></p>
        </div>
      )
    },
    {
      title: '配置应用能力',
      content: (
        <div className="space-y-2">
          <p>在「应用能力」→「机器人」页面：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>启用「机器人」能力</li>
            <li>配置「消息卡片」请求地址</li>
            <li>设置消息接收地址（Webhook）</li>
          </ul>
        </div>
      )
    },
    {
      title: '配置权限',
      content: (
        <div className="space-y-2">
          <p>在「权限管理」页面添加以下权限：</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
            <li><code>im:message</code> - 获取与发送消息</li>
            <li><code>im:message:send_as_bot</code> - 以应用身份发消息</li>
            <li><code>contact:user.base:readonly</code> - 获取用户基本信息</li>
          </ul>
          <p className="text-orange-600 text-sm mt-2">⚠️ 配置权限后需发布版本才能生效！</p>
        </div>
      )
    },
    {
      title: '事件订阅配置',
      content: (
        <div className="space-y-2">
          <p>在「事件订阅」页面：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>配置请求地址：{`http://your-server:port/webhook/feishu`}</li>
            <li>订阅事件：接收消息、消息已读等</li>
          </ul>
          <p className="text-sm text-gray-500 mt-2">如果是本地开发，可使用 WebSocket 模式</p>
        </div>
      )
    },
    {
      title: '发布应用',
      content: (
        <div className="space-y-2">
          <p>1. 在「版本管理与发布」创建版本</p>
          <p>2. 提交审核（企业内部应用可跳过审核）</p>
          <p>3. 发布成功后，应用可用</p>
          <p>4. 在飞书中搜索应用名称即可使用</p>
        </div>
      )
    }
  ]

  return (
    <div className="flex gap-6 max-w-5xl">
      {/* 左侧：配置表单 */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">飞书通道配置</h2>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Info className="w-3 h-3" />
            <span>配置格式: OpenClaw 2026.3.13</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            App ID
          </label>
          <input
            type="text"
            value={appId}
            onChange={e => setAppId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="cli_xxxxxxxxxxxx"
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">
            App Secret
          </label>
          <input
            type="password"
            value={appSecret}
            onChange={e => setAppSecret(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••••••••••"
          />

          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
            <strong>配置将保存到:</strong>
            <code className="ml-2 text-blue-600">channels.feishu</code>
            <div className="mt-1 text-xs">app_id, app_secret</div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? '保存中...' : '保存配置'}
            </button>
            
            {saved && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                已保存
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 右侧：配置指南 */}
      <div className="w-80">
        <div className="bg-gray-50 rounded-xl p-4 sticky top-4">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            平台端配置指南
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
              href="https://open.feishu.cn/document/home/introduction-to-feishu-open-platform/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              飞书开放平台文档 <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://docs.openclaw.ai/channels/feishu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              OpenClaw 飞书配置文档 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}