import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { CheckCircle, Loader2, Save, Info } from 'lucide-react'

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

interface Provider {
  id: string
  name: string
  baseUrl: string
  api: string
  description?: string
}

const PROVIDERS: Provider[] = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', api: 'openai-completions', description: 'GPT-4, GPT-3.5' },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', api: 'anthropic-completions', description: 'Claude 3.5' },
  { id: 'qwencode', name: 'Qwen (通义千问)', baseUrl: 'https://coding.dashscope.aliyuncs.com/v1', api: 'openai-completions', description: 'Qwen 3' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', api: 'openai-completions', description: 'DeepSeek Chat/Coder' },
  { id: 'moonshot', name: 'Moonshot (Kimi)', baseUrl: 'https://api.moonshot.cn/v1', api: 'openai-completions', description: 'Kimi 模型' },
  { id: 'zhipu', name: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', api: 'openai-completions', description: 'GLM-4' },
  { id: 'local', name: '本地模型 (Ollama)', baseUrl: 'http://localhost:11434/v1', api: 'openai-completions', description: '本地部署' },
]

const API_TYPES = [
  { id: 'openai-completions', name: 'OpenAI 兼容', description: '大多数 API 使用此格式' },
  { id: 'anthropic-completions', name: 'Anthropic', description: 'Claude 官方 API' },
]

export default function ModelConfig() {
  const [config, setConfig] = useState<OpenClawConfig>({})
  const [provider, setProvider] = useState('qwencode')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState(PROVIDERS[2].baseUrl)
  const [apiType, setApiType] = useState('openai-completions')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    invoke<OpenClawConfig>('read_config').then(cfg => {
      setConfig(cfg)
      const providers = cfg.models?.providers
      if (providers) {
        const foundProvider = Object.keys(providers)[0]
        if (foundProvider) {
          setProvider(foundProvider)
          setBaseUrl(providers[foundProvider].base_url || '')
          setApiKey(providers[foundProvider].api_key || '')
          setApiType(providers[foundProvider].api || 'openai-completions')
        }
      }
    })
  }, [])

  const handleProviderChange = (id: string) => {
    setProvider(id)
    const p = PROVIDERS.find(p => p.id === id)
    if (p) {
      setBaseUrl(p.baseUrl)
      setApiType(p.api)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const newConfig = {
        ...config,
        models: {
          mode: 'merge',
          providers: {
            [provider]: {
              base_url: baseUrl,
              api_key: apiKey,
              api: apiType,
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

  const selectedProvider = PROVIDERS.find(p => p.id === provider)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">模型配置</h2>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Info className="w-3 h-3" />
          <span>配置格式: OpenClaw 2026.3.13</span>
        </div>
      </div>
      
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
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`font-medium ${provider === p.id ? 'text-blue-700' : 'text-gray-700'}`}>
                {p.name}
              </span>
              {p.description && (
                <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://api.example.com/v1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API 类型
            </label>
            <select
              value={apiType}
              onChange={e => setApiType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {API_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

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

        {selectedProvider && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
            <strong>配置将保存到:</strong>
            <code className="ml-2 text-blue-600">models.providers.{provider}</code>
            <div className="mt-1 text-xs">
              base_url, api_key, api: "{apiType}"
            </div>
          </div>
        )}

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