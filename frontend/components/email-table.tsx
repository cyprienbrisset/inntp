'use client'

import { CheckCircle2, XCircle, Clock, Loader2, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Email {
  id: string
  from: string
  to: string
  subject: string
  status: 'sent' | 'failed' | 'pending' | 'queued'
  size: number
  timestamp: Date
  hasAttachments: boolean
}

interface EmailTableProps {
  emails: Email[]
  onEmailClick: (email: Email) => void
}

const statusConfig = {
  sent: { icon: CheckCircle2, label: 'Envoyé', className: 'status-success' },
  failed: { icon: XCircle, label: 'Échec', className: 'status-error' },
  pending: { icon: Clock, label: 'En attente', className: 'status-pending' },
  queued: { icon: Loader2, label: 'En file', className: 'status-queued' },
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round(bytes / Math.pow(k, i))} ${sizes[i]}`
}

export function EmailTable({ emails, onEmailClick }: EmailTableProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Expéditeur</th>
              <th>Destinataire</th>
              <th>Sujet</th>
              <th>Statut</th>
              <th>Taille</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => {
              const StatusIcon = statusConfig[email.status].icon
              const statusClass = statusConfig[email.status].className
              const statusLabel = statusConfig[email.status].label

              return (
                <tr key={email.id} onClick={() => onEmailClick(email)}>
                  <td className="font-mono text-xs">
                    {formatDistanceToNow(email.timestamp, { addSuffix: true, locale: fr })}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{email.from}</span>
                    </div>
                  </td>
                  <td>
                    <span className="truncate max-w-[200px] block">{email.to}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {email.hasAttachments && (
                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="truncate max-w-[300px]">{email.subject}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${statusClass}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusLabel}
                    </span>
                  </td>
                  <td className="text-muted-foreground font-mono text-xs">
                    {formatBytes(email.size)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
