'use client'

import { useState } from 'react'
import { Server, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, type ServerStatus as ServerStatusType } from '@/lib/api'
import { toast } from 'sonner'

interface ServerStatusProps {
  status: ServerStatusType | null
  onRefresh?: () => void
}

export function ServerStatus({ status, onRefresh }: ServerStatusProps) {
  const [isRestarting, setIsRestarting] = useState(false)

  const handleRestart = async () => {
    try {
      setIsRestarting(true)
      toast.info('Redémarrage du serveur SMTP en cours...')
      
      await api.restartSmtp()
      
      toast.success('Serveur SMTP redémarré avec succès')
      
      // Attendre 2 secondes puis rafraîchir les données
      setTimeout(() => {
        if (onRefresh) {
          onRefresh()
        }
        setIsRestarting(false)
      }, 2000)
    } catch (error) {
      console.error('Erreur lors du redémarrage du serveur SMTP:', error)
      toast.error('Échec du redémarrage du serveur SMTP')
      setIsRestarting(false)
    }
  }

  const isRunning = status?.smtp?.running ?? false
  const port = status?.smtp?.port ?? 2525
  const totalEmails = status?.totals?.emails ?? 0
  const dbOk = status?.db?.ok ?? false

  const displayStatus = isRestarting ? 'restarting' : isRunning ? 'active' : 'inactive'

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isRunning ? 'bg-success/10' : 'bg-destructive/10'
          }`}>
            <Server className={`w-6 h-6 ${isRunning ? 'text-success' : 'text-destructive'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Serveur SMTP</h3>
            <p className="text-sm text-muted-foreground">Port {port}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRestart}
          disabled={isRestarting}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRestarting ? 'animate-spin' : ''}`} />
          Redémarrer
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Statut</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              displayStatus === 'active' ? 'bg-success animate-pulse' : 
              displayStatus === 'restarting' ? 'bg-warning animate-pulse' : 
              'bg-destructive'
            }`} />
            <p className="text-sm font-semibold text-foreground capitalize">
              {displayStatus === 'active' ? 'Actif' : displayStatus === 'restarting' ? 'Redémarrage' : 'Inactif'}
            </p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Base de données</p>
          <p className="text-sm font-semibold text-foreground">
            {dbOk ? 'Connectée' : 'Déconnectée'}
          </p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Total emails</p>
          <p className="text-sm font-semibold text-foreground">{totalEmails.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
