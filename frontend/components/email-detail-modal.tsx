'use client'

import { X, Send, RefreshCw, Download, Paperclip, Calendar, User, MailIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Email {
  id: string
  from: string
  to: string
  cc?: string
  bcc?: string
  subject: string
  status: 'sent' | 'failed' | 'pending' | 'queued'
  size: number
  timestamp: Date
  hasAttachments: boolean
  bodyText?: string
  bodyHtml?: string
  attachments?: Array<{ name: string; size: number }>
  headers?: Record<string, string>
  errorMessage?: string
}

interface EmailDetailModalProps {
  email: Email | null
  onClose: () => void
  onRetry?: (emailId: string) => void
  onSend?: (emailId: string) => void
}

export function EmailDetailModal({ email, onClose, onRetry, onSend }: EmailDetailModalProps) {
  if (!email) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate mb-1">
              {email.subject}
            </h2>
            <p className="text-sm text-muted-foreground">
              ID: {email.id}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {email.status === 'failed' && onRetry && (
              <Button size="sm" variant="outline" onClick={() => onRetry(email.id)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            )}
            {email.status === 'pending' && onSend && (
              <Button size="sm" onClick={() => onSend(email.id)}>
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <User className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Expéditeur</span>
              </div>
              <p className="text-sm font-medium text-foreground">{email.from}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MailIcon className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Destinataire</span>
              </div>
              <p className="text-sm font-medium text-foreground">{email.to}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Date</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {formatDistanceToNow(email.timestamp, { addSuffix: true, locale: fr })}
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Paperclip className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Pièces jointes</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {email.attachments?.length || 0}
              </p>
            </div>
          </div>

          {/* CC/BCC if present */}
          {(email.cc || email.bcc) && (
            <div className="space-y-2">
              {email.cc && (
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[60px]">CC:</span>
                  <span className="text-sm text-foreground">{email.cc}</span>
                </div>
              )}
              {email.bcc && (
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[60px]">BCC:</span>
                  <span className="text-sm text-foreground">{email.bcc}</span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {email.errorMessage && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm font-medium text-destructive mb-1">Erreur d'envoi</p>
              <p className="text-sm text-destructive/80">{email.errorMessage}</p>
            </div>
          )}

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Pièces jointes</h3>
              <div className="space-y-2">
                {email.attachments.map((attachment, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{attachment.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        {Math.round(attachment.size / 1024)} KB
                      </span>
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Body */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Contenu</h3>
            <div className="bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-y-auto">
              {email.bodyHtml ? (
                <div 
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                />
              ) : (
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                  {email.bodyText || 'Aucun contenu disponible'}
                </pre>
              )}
            </div>
          </div>

          {/* Headers */}
          {email.headers && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">En-têtes</h3>
              <div className="bg-muted/30 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <pre className="text-xs font-mono text-muted-foreground">
                  {Object.entries(email.headers).map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <span className="text-primary">{key}:</span> {value}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
