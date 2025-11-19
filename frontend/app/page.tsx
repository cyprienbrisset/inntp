'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { MetricCard } from '@/components/metric-card'
import { ServerStatus } from '@/components/server-status'
import { RecentEmails } from '@/components/recent-emails'
import { ActivityChart } from '@/components/activity-chart'
import { Mail, Send, XCircle, Clock, TrendingUp } from 'lucide-react'
import { api, type Email, type ServerStatus as ServerStatusType } from '@/lib/api'

interface DashboardStats {
  totalEmails: number
  sentEmails: number
  failedEmails: number
  pendingEmails: number
  successRate: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmails: 0,
    sentEmails: 0,
    failedEmails: 0,
    pendingEmails: 0,
    successRate: 0,
  })
  const [recentEmails, setRecentEmails] = useState<Email[]>([])
  const [allEmails, setAllEmails] = useState<Email[]>([])
  const [serverStatus, setServerStatus] = useState<ServerStatusType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Charger le statut du serveur
      const status = await api.getStatus()
      setServerStatus(status)

      // Charger tous les emails (limité à 1000 pour les statistiques)
      const emailsResponse = await api.getEmails({ limit: 1000, offset: 0 })
      const emails = emailsResponse.items
      setAllEmails(emails)

      // Charger les 5 emails les plus récents
      const recentResponse = await api.getEmails({ limit: 5, offset: 0 })
      setRecentEmails(recentResponse.items)

      // Calculer les statistiques
      const sent = emails.filter(e => e.status === 'sent').length
      const failed = emails.filter(e => e.status === 'failed' || e.status === 'error').length
      const pending = emails.filter(e => e.status === 'pending' || e.status === 'received').length
      const total = emails.length
      const successRate = total > 0 ? (sent / total) * 100 : 0

      setStats({
        totalEmails: total,
        sentEmails: sent,
        failedEmails: failed,
        pendingEmails: pending,
        successRate,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des données du dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header 
          title="Dashboard" 
          subtitle="Vue d'ensemble de votre relay SMTP"
        />
        
        <div className="p-8 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Emails envoyés"
              value={stats.sentEmails.toLocaleString()}
              change={`${stats.totalEmails} total`}
              changeType="neutral"
              icon={Send}
              iconColor="text-primary"
            />
            <MetricCard
              title="Échecs"
              value={stats.failedEmails.toLocaleString()}
              change={stats.failedEmails > 0 ? 'Nécessite attention' : 'Aucun échec'}
              changeType={stats.failedEmails > 0 ? 'negative' : 'positive'}
              icon={XCircle}
              iconColor="text-destructive"
            />
            <MetricCard
              title="En attente"
              value={stats.pendingEmails.toLocaleString()}
              change={stats.pendingEmails > 0 ? 'À traiter' : 'Aucun en attente'}
              changeType="neutral"
              icon={Clock}
              iconColor="text-warning"
            />
            <MetricCard
              title="Taux de succès"
              value={`${stats.successRate.toFixed(1)}%`}
              change={stats.totalEmails > 0 ? `Sur ${stats.totalEmails} emails` : 'Aucune donnée'}
              changeType={stats.successRate >= 95 ? 'positive' : stats.successRate >= 80 ? 'neutral' : 'negative'}
              icon={TrendingUp}
              iconColor="text-success"
            />
          </div>

          {/* Server Status */}
          <ServerStatus status={serverStatus} onRefresh={loadDashboardData} />

          {/* Activity Chart */}
          <ActivityChart emails={allEmails} />

          {/* Recent Emails */}
          <RecentEmails emails={recentEmails} />
        </div>
      </main>
    </div>
  )
}
