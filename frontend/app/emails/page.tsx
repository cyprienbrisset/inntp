'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { EmailFilters } from '@/components/email-filters'
import { EmailTable } from '@/components/email-table'
import { EmailDetailModal } from '@/components/email-detail-modal'
import { Pagination } from '@/components/pagination'
import { api, type Email } from '@/lib/api'
import { toast } from 'sonner'

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [totalEmails, setTotalEmails] = useState(0)
  
  const itemsPerPage = 50

  useEffect(() => {
    loadEmails()
  }, [currentPage, searchQuery, statusFilter])

  useEffect(() => {
    if (selectedEmailId) {
      loadEmailDetail(selectedEmailId)
    } else {
      setSelectedEmail(null)
    }
  }, [selectedEmailId])

  const loadEmails = async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * itemsPerPage
      
      const params: any = {
        limit: itemsPerPage,
        offset,
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      if (searchQuery) {
        params.q = searchQuery
      }

      const response = await api.getEmails(params)
      setEmails(response.items)
      
      // Pour le total, on fait une requête sans limite pour avoir le compte exact
      const totalResponse = await api.getEmails({ 
        limit: 1, 
        offset: 0,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(searchQuery ? { q: searchQuery } : {})
      })
      // Note: L'API ne retourne pas le total, on utilise une approximation
      setTotalEmails(response.items.length < itemsPerPage ? offset + response.items.length : (currentPage + 1) * itemsPerPage)
    } catch (error) {
      console.error('Erreur lors du chargement des emails:', error)
      toast.error('Impossible de charger les emails')
    } finally {
      setLoading(false)
    }
  }

  const loadEmailDetail = async (id: number) => {
    try {
      const email = await api.getEmail(id)
      setSelectedEmail(email)
    } catch (error) {
      console.error('Erreur lors du chargement du détail de l\'email:', error)
      toast.error('Impossible de charger les détails de l\'email')
      setSelectedEmailId(null)
    }
  }

  const handleEmailClick = (email: Email) => {
    setSelectedEmailId(email.id)
  }

  const handleExport = () => {
    toast.info('Fonctionnalité d\'export en cours de développement')
  }

  const handleRetry = async (emailId: number) => {
    try {
      toast.info('Nouvelle tentative d\'envoi en cours...')
      const result = await api.retryEmail(emailId)
      
      if (result.ok) {
        toast.success('Email envoyé avec succès')
      } else {
        toast.error(`Échec de l'envoi: ${result.error}`)
      }
      
      // Recharger les emails et le détail
      await loadEmails()
      if (selectedEmailId === emailId) {
        await loadEmailDetail(emailId)
      }
    } catch (error: any) {
      console.error('Erreur lors de la nouvelle tentative:', error)
      toast.error(`Erreur: ${error.message || 'Échec de l\'envoi'}`)
    }
  }

  const handleSend = async (emailId: number) => {
    try {
      toast.info('Envoi en cours...')
      const result = await api.sendEmail(emailId)
      
      if (result.ok) {
        toast.success('Email envoyé avec succès')
      } else {
        toast.error(`Échec de l'envoi: ${result.error}`)
      }
      
      // Recharger les emails et le détail
      await loadEmails()
      if (selectedEmailId === emailId) {
        await loadEmailDetail(emailId)
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi:', error)
      toast.error(`Erreur: ${error.message || 'Échec de l\'envoi'}`)
    }
  }

  const totalPages = Math.ceil(totalEmails / itemsPerPage)

  if (loading && emails.length === 0) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Header title="Emails" subtitle="Chargement..." />
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des emails...</p>
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
          title="Emails" 
          subtitle={`${totalEmails} email${totalEmails > 1 ? 's' : ''} au total`}
        />
        
        <div className="p-8 space-y-6">
          <EmailFilters
            onSearch={setSearchQuery}
            onStatusChange={setStatusFilter}
            onExport={handleExport}
          />

          <EmailTable
            emails={emails}
            onEmailClick={handleEmailClick}
            loading={loading}
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </main>

      <EmailDetailModal
        email={selectedEmail}
        onClose={() => setSelectedEmailId(null)}
        onRetry={handleRetry}
        onSend={handleSend}
      />
    </div>
  )
}
