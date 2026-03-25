import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ExternalLink, CheckCircle, Loader2, Save, Info, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface OpenClawConfig {
  channels?: {
    qqbot?: {
      enabled: boolean
      app_id?: string
      client_secret?: string
    }
  }
  plugins?: {
    entries?: {
      openclaw_qqbot?: { enabled: boolean }
    }
  }
}

export default function QQBotConfig() {
  const [config, setConfig] = useState<OpenClawConfig>({})
  const [appId, setAppId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedStep, setExpandedStep] = useState<number | null>(1)

  useEffect(() => {
    invoke<OpenClawConfig>('read_config').then(cfg => {
      setConfig(cfg)
      if (cfg.channels?.qqbot) {
        setAppId(cfg.channels.qqbot.app_id || '')
        setClientSecret(cfg.channels.qqbot.client_secret || '')
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
          qqbot: {
            enabled: true,
            app_id: appId,
            client_secret: clientSecret,
          }
        },
        plugins: {
          entries: {
            ...config.plugins?.entries,
            openclaw_qqbot: { enabled: true }
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
      title: '创建 QQ 机器人应用',
      content: (
        <div className="space-y-2">
          <p>1. 访问 <a href="https://q.qq.com/" target="_blank" className="text-blue-600 hover:underline">QQ 开放平台</a> 并登录</p>
          <p>2. 点击「创建应用」→ 选择「机器人」类型</p>
          <p>3. 填写应用名称、简介等信息</p>
          <p>4. 创建成功后，在应用详情页可看到 <strong>App ID</strong> 和 <strong>Client Secret</strong></p>
        </div>
      )
    },
    {
      title: '配置 Intents (事件订阅)',
      content: (
        <div className="space-y-2">
          <p>在应用管理页面 → 「功能」→「Intents」：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>必选：</strong>AT_MESSAGES (艾特消息)</li>
            <li><strong>建议：</strong>GROUP_AT_MESSAGES (群艾特消息)</li>
            <li><strong>建议：</strong>GROUP_MESSAGES (群消息)</li>
            <li><strong>建议：</strong>C2C_MESSAGES (私聊消息)</li>
          </ul>
          <p className="text-orange-600 text-sm mt-2">⚠️ 不开启 Intents 将无法收到消息！</p>
        </div>
      )
    },
    {
      title: '配置沙箱成员',
      content: (
        <div className="space-y-2">
          <p>开发阶段只能与沙箱成员互动：</p>
          <p>1. 在「沙箱」页面添加测试 QQ 号</p>
          <p>2. 测试完成后，提交应用审核上线</p>
          <p>3. 上线后可与服务器的所有用户互动</p>
        </div>
      )
    },
    {
      title: '填写配置并启动',
      content: (
        <div className="space-y-2">
          <p>1. 将 App ID 和 Client Secret 填入左侧表单</p>
          <p>2. 点击「保存配置」</p>
          <p>3. 在 Gateway 页面启动服务</p>
          <p>4. 机器人开始工作！</p>
        </div>
      )
    }
  ]

  return (
    <div className="flex gap-6 max-w-5xl">
      {/* 左侧：配置表单 */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">QQ Bot 配置</h2>
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
            placeholder="10xxxxxxxx"
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Secret
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={e => setClientSecret(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••••••••••"
          />

          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
            <strong>配置将保存到:</strong>
            <code className="ml-2 text-blue-600">channels.qqbot</code>
            <div className="mt-1 text-xs">app_id, client_secret</div>
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

          <div className="mt-4 pt-3 border-t border-gray-200">
            <a
              href="https://bot.q.qq.com/wiki/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              QQ 机器人开发文档 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}