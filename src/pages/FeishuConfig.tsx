import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ExternalLink, CheckCircle, Loader2, Save } from 'lucide-react'

interface OpenClawConfig {
  models?: {
    mode?: string
    providers?: Record<string, {
      base_url?: string
      api_key?: string
      api?: string
      models?: { id: string; name?: string }[]
    }>
  }
  channels?: {
    feishu?: {
      enabled: boolean
      app_id?: string
      app_secret?: string
    }
  }
  plugins?: {
    entries?: {
      feishu?: {
        enabled: boolean
      }
    }
  }
  gateway?: any
}

export default function FeishuConfig() {
  const [config, setConfig] = useState<OpenClawConfig>({})
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    invoke<OpenClawConfig>('read_config').then(cfg => {
      setConfig(cfg)
      // 从 channels.feishu 读取配置
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
        // 飞书通道配置
        channels: {
          ...config.channels,
          feishu: {
            enabled: true,
            app_id: appId,
            app_secret: appSecret,
          }
        },
        // 插件启用配置
        plugins: {
          entries: {
            ...config.plugins?.entries,
            feishu: {
              enabled: true
            }
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
      <h2 className="text-xl font-semibold text-gray-800 mb-6">飞书通道配置</h2>

      {/* 步骤引导 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">创建飞书应用</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>访问飞书开放平台创建企业自建应用</li>
          <li>获取 App ID 和 App Secret</li>
          <li>配置事件订阅和权限</li>
        </ol>
        <a
          href="https://open.feishu.cn/app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2 text-sm"
        >
          打开飞书开放平台 <ExternalLink className="w-4 h-4" />
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