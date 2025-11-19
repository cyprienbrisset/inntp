import { Mail, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { type Email } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface RecentEmailsProps {
  emails: Email[]
}

const statusConfig = {
  sent: { icon: CheckCircle2, label: 'Envoyé', className: 'status-success' },
  failed: { icon: XCircle, label: 'Échec', className: 'status-error' },
  error: { icon: XCircle, label: 'Erreur', className: 'status-error' },
  pending: { icon: AlertCircle, label: 'En attente', className: 'status-pending' },
  received: { icon: Clock, label: 'Reçu', className: 'status-pending' },
}

export function RecentEmails({ emails }: RecentEmailsProps) {
  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || {
      icon: AlertCircle,
      label: status,
      className: 'status-pending'
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true, locale: fr })
    } catch {
      return dateString
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Emails récents</h3>
        </div>
        <Link href="/emails">
          <Button variant="ghost" size="sm">
            Voir tout
          </Button>
        </Link>
      </div>

      <div className="divide-y divide-border">
        {emails.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun email récent</p>
          </div>
        ) : (
          emails.map((email) => {
            const config = getStatusConfig(email.status)
            const StatusIcon = config.icon

            return (
              <Link
                key={email.id}
                href={`/emails?id=${email.id}`}
                className="block p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {email.subject || '(sans objet)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="truncate">{email.from_address}</span>
                      <span>→</span>
                      <span className="truncate">{email.to_addresses}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`status-badge ${config.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {formatTime(email.received_at)}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
