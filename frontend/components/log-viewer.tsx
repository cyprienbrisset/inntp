'use client'

import { useEffect, useRef } from 'react'
import { AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react'

export interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  source?: string
}

interface LogViewerProps {
  logs: LogEntry[]
  autoScroll?: boolean
}

const levelConfig = {
  info: {
    icon: Info,
    color: 'text-primary',
    bg: 'bg-primary/10',
    label: 'INFO',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    label: 'WARN',
  },
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    label: 'ERROR',
  },
  debug: {
    icon: Bug,
    color: 'text-muted-foreground',
    bg: 'bg-muted/30',
    label: 'DEBUG',
  },
}

export function LogViewer({ logs, autoScroll = true }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  }

  return (
    <div
      ref={containerRef}
      className="log-viewer"
    >
      {logs.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <p className="text-sm">Aucun log disponible</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {logs.map((log) => {
            const config = levelConfig[log.level]
            const Icon = config.icon

            return (
              <div
                key={log.id}
                className="log-line flex items-start gap-3 px-2 py-1.5 rounded hover:bg-muted/30 transition-colors"
              >
                <span className="text-muted-foreground font-mono text-xs flex-shrink-0 mt-0.5">
                  {formatTimestamp(log.timestamp)}
                </span>
                
                <div className={`flex items-center gap-1.5 ${config.bg} px-2 py-0.5 rounded flex-shrink-0`}>
                  <Icon className={`w-3 h-3 ${config.color}`} />
                  <span className={`text-xs font-semibold ${config.color}`}>
                    {config.label}
                  </span>
                </div>

                {log.source && (
                  <span className="text-accent text-xs font-medium flex-shrink-0 mt-0.5">
                    [{log.source}]
                  </span>
                )}

                <span className="text-foreground text-xs flex-1 mt-0.5">
                  {log.message}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
