import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Play, Square, RotateCw, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface GatewayStatusInfo {
  running: boolean
  port?: number
  pid?: number
}

export default function GatewayStatus() {
  const [status, setStatus] = useState<GatewayStatusInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const refreshStatus = async () => {
    try {
      const s = await invoke<GatewayStatusInfo>('gateway_status')
      setStatus(s)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleStart = async () => {
    setActionLoading('start')
    try {
      await invoke('gateway_start')
      setTimeout(refreshStatus, 2000)
    } catch (e) {
      alert('启动失败: ' + e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStop = async () => {
    setActionLoading('stop')
    try {
      await invoke('gateway_stop')
      setTimeout(refreshStatus, 1000)
    } catch (e) {
      alert('停止失败: ' + e)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestart = async () => {
    setActionLoading('restart')
    try {
      await invoke('gateway_stop')
      await new Promise(r => setTimeout(r, 1000))
      await invoke('gateway_start')
      setTimeout(refreshStatus, 2000)
    } catch (e) {
      alert('重启失败: ' + e)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Gateway 状态</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* 状态显示 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {status?.running ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">运行中</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <XCircle className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-500">已停止</span>
                  </div>
                )}
              </div>
              
              {status?.port && (
                <span className="text-sm text-gray-500">
                  端口: {status.port}
                </span>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              {!status?.running ? (
                <button
                  onClick={handleStart}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === 'start' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  启动
                </button>
              ) : (
                <>
                  <button
                    onClick={handleStop}
                    disabled={actionLoading !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === 'stop' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    停止
                  </button>
                  <button
                    onClick={handleRestart}
                    disabled={actionLoading !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === 'restart' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCw className="w-4 h-4" />
                    )}
                    重启
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 使用提示 */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p>Gateway 是 OpenClaw 的核心服务，负责消息路由和任务调度。</p>
        <p className="mt-1">配置完成后需要启动 Gateway 才能正常使用。</p>
      </div>
    </div>
  )
}