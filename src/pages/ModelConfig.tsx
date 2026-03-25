import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { CheckCircle, Loader2, Save } from 'lucide-react'

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
  channels?: any
  gateway?: any
}

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', api: 'openai-completions' },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', api: 'anthropic-completions' },
  { id: 'qwencode', name: 'Qwen (通义千问)', baseUrl: 'https://coding.dashscope.aliyuncs.com/v1', api: 'openai-completions' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', api: 'openai-completions' },
  { id: 'moonshot', name: 'Moonshot (Kimi)', baseUrl: 'https://api.moonshot.cn/v1', api: 'openai-completions' },
  { id: 'zhipu', name: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', api: 'openai-completions' },
  { id: 'local', name: '本地模型 (Ollama)', baseUrl: 'http://localhost:11434/v1', api: 'openai-completions' },
]

export default function ModelConfig() {
  const [config, setConfig] = useState<OpenClawConfig>({})
  const [provider, setProvider] = useState('qwencode')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState(PROVIDERS[2].baseUrl)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    invoke<OpenClawConfig>('read_config').then(cfg => {
      setConfig(cfg)
      // 尝试恢复已保存的配置
      const providers = cfg.models?.providers
      if (providers) {
        const foundProvider = Object.keys(providers)[0]
        if (foundProvider) {
          setProvider(foundProvider)
          setBaseUrl(providers[foundProvider].base_url || '')
          setApiKey(providers[foundProvider].api_key || '')
        }
      }
    })
  }, [])

  const handleProviderChange = (id: string) => {
    setProvider(id)
    const p = PROVIDERS.find(p => p.id === id)
    if (p) {
      setBaseUrl(p.baseUrl)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const selectedProvider = PROVIDERS.find(p => p.id === provider)
      const newConfig = {
        ...config,
        models: {
          mode: 'merge',
          providers: {
            [provider]: {
              base_url: baseUrl,
              api_key: apiKey,
              api: selectedProvider?.api || 'openai-completions',
              models: [{ id: 'default', name: 'Default Model' }]
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
      <h2 className="text-xl font-semibold text-gray-800 mb-6">模型配置</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择 AI 模型提供商
        </label>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => handleProviderChange(p.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                provider === p.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-medium">{p.name}</span>
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Base URL
        </label>
        <input
          type="text"
          value={baseUrl}
          onChange={e => setBaseUrl(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://api.example.com/v1"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="sk-..."
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