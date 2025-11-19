'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { LogFilters } from '@/components/log-filters'
import { LogViewer, type LogEntry } from '@/components/log-viewer'
import { LogStats } from '@/components/log-stats'
import { api, type SystemLog } from '@/lib/api'
import { toast } from 'sonner'

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(true)

  // Load logs from API
  const loadLogs = async () => {
    try {
      const response = await api.getSystemLogs()
      const systemLogs = response.items
      
      // Convertir les SystemLog en LogEntry
      const logEntries: LogEntry[] = systemLogs.map(log => ({
        id: `log-${log.id}`,
        timestamp: new Date(log.created_at),
        level: log.level as 'info' | 'warning' | 'error' | 'debug',
        message: log.message,
        source: log.component,
        details: log.details,
      }))
      
      setLogs(logEntries)
      setLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error)
      toast.error('Impossible de charger les logs système')
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadLogs()
  }, [])

  // Auto-refresh logs
  useEffect(() => {
    if (!isAutoRefresh) return

    const interval = setInterval(() => {
      loadLogs()
    }, 5000) // Rafraîchir toutes les 5 secondes

    return () => clearInterval(interval)
  }, [isAutoRefresh])

  // Filter logs
  useEffect(() => {
    let filtered = logs

    if (levelFilter !== 'all') {
      filtered = filtered.filter((log) => log.level === levelFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.source?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }, [logs, searchQuery, levelFilter])

  // Calculate stats
  const stats = {
    info: logs.filter((log) => log.level === 'info').length,
    warning: logs.filter((log) => log.level === 'warning').length,
    error: logs.filter((log) => log.level === 'error').length,
    debug: logs.filter((log) => log.level === 'debug').length,
  }

  const handleExport = () => {
    const logText = filteredLogs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${
            log.source ? `[${log.source}] ` : ''
          }${log.message}`
      )
      .join('\n')

    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smtp-logs-${new Date().toISOString()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs exportés avec succès')
  }

  const handleManualRefresh = () => {
    loadLogs()
    toast.info('Logs rafraîchis')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Header title="Logs système" subtitle="Chargement..." />
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des logs...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header
          title="Logs système"
          subtitle={`${filteredLogs.length} entrées ${isAutoRefresh ? '(mise à jour automatique)' : ''}`}
        />

        <div className="p-8 space-y-6">
          {/* Stats */}
          <LogStats stats={stats} />

          {/* Filters */}
          <LogFilters
            onSearch={setSearchQuery}
            onLevelChange={setLevelFilter}
            onExport={handleExport}
            isAutoRefresh={isAutoRefresh}
            onToggleAutoRefresh={() => setIsAutoRefresh(!isAutoRefresh)}
            onManualRefresh={handleManualRefresh}
          />

          {/* Log Viewer */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-6 py-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Console système
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                  <span className="text-xs text-muted-foreground">
                    {isAutoRefresh ? 'En direct' : 'Pause'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <LogViewer logs={filteredLogs} autoScroll={isAutoRefresh} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
