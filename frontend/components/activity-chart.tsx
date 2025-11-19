'use client'

import { TrendingUp } from 'lucide-react'
import { type Email } from '@/lib/api'

interface ActivityChartProps {
  emails: Email[]
}

export function ActivityChart({ emails }: ActivityChartProps) {
  // Agréger les emails par heure pour les dernières 24 heures
  const now = new Date()
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hourStart = new Date(now)
    hourStart.setHours(now.getHours() - 23 + i, 0, 0, 0)
    const hourEnd = new Date(hourStart)
    hourEnd.setHours(hourStart.getHours() + 1)

    // Filtrer les emails de cette heure
    const hourEmails = emails.filter(email => {
      const emailDate = new Date(email.received_at)
      return emailDate >= hourStart && emailDate < hourEnd
    })

    const sent = hourEmails.filter(e => e.status === 'sent').length
    const failed = hourEmails.filter(e => e.status === 'failed' || e.status === 'error').length

    return {
      hour: `${hourStart.getHours()}h`,
      sent,
      failed,
      total: hourEmails.length,
    }
  })

  const maxValue = Math.max(...hours.map(h => h.total), 1) // Au moins 1 pour éviter division par 0

  const totalSent = hours.reduce((sum, h) => sum + h.sent, 0)
  const totalFailed = hours.reduce((sum, h) => sum + h.failed, 0)

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Activité (24h)</h3>
            <p className="text-sm text-muted-foreground">
              {totalSent + totalFailed} emails • {totalSent} envoyés • {totalFailed} échecs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Envoyés</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Échecs</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1 h-48">
        {hours.map((data, i) => {
          const sentHeight = maxValue > 0 ? (data.sent / maxValue) * 100 : 0
          const failedHeight = maxValue > 0 ? (data.failed / maxValue) * 100 : 0
          const hasData = data.total > 0

          return (
            <div 
              key={i} 
              className="flex-1 flex flex-col items-center gap-1 group relative"
              title={`${data.hour}: ${data.total} emails (${data.sent} envoyés, ${data.failed} échecs)`}
            >
              <div className="w-full flex flex-col justify-end h-full gap-0.5">
                {data.sent > 0 && (
                  <div 
                    className="w-full bg-primary rounded-t transition-all group-hover:bg-primary/80"
                    style={{ height: `${sentHeight}%`, minHeight: hasData ? '2px' : '0' }}
                  />
                )}
                {data.failed > 0 && (
                  <div 
                    className="w-full bg-destructive rounded-t transition-all group-hover:bg-destructive/80"
                    style={{ height: `${failedHeight}%`, minHeight: '2px' }}
                  />
                )}
                {!hasData && (
                  <div className="w-full h-0.5 bg-muted/20" />
                )}
              </div>
              {i % 4 === 0 && (
                <span className="text-xs text-muted-foreground mt-2">{data.hour}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
