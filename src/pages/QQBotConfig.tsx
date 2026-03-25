import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ExternalLink, CheckCircle, Loader2, Save, Info } from 'lucide-react'

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

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">QQ Bot 配置</h2>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Info className="w-3 h-3" />
          <span>配置格式: OpenClaw 2026.3.13</span>
        </div>
      </div>

      {/* 步骤引导 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">创建 QQ 机器人</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>访问 QQ 开放平台创建机器人应用</li>
          <li>获取 App ID 和 Client Secret</li>
          <li>配置事件订阅和 Intents</li>
        </ol>
        <a
          href="https://q.qq.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2 text-sm"
        >
          打开 QQ 开放平台 <ExternalLink className="w-4 h-4" />
        </a>
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
          <div className="mt-1 text-xs">
            app_id, client_secret
          </div>
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
  )
}