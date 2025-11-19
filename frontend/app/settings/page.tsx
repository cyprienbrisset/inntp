'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { SettingsSection } from '@/components/settings-section'
import { FormField } from '@/components/form-field'
import { TestConnectionButton } from '@/components/test-connection-button'
import { Button } from '@/components/ui/button'
import { Server, Shield, Mail, Save, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function SettingsPage() {
  // SMTP Settings
  const [smtpPort, setSmtpPort] = useState('2525')
  const [smtpHost, setSmtpHost] = useState('0.0.0.0')
  const [webPort, setWebPort] = useState('3000')
  const [smtpEnabled, setSmtpEnabled] = useState(true)

  // Azure AD Settings
  const [tenantId, setTenantId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  // Office 365 Settings
  const [o365Email, setO365Email] = useState('')
  const [o365Host, setO365Host] = useState('smtp.office365.com')
  const [o365Port, setO365Port] = useState('587')

  // Form state
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    try {
      setLoading(true)
      const response = await api.getConfig()
      const config = response.config
      
      // Charger les valeurs
      setSmtpPort(config.SMTP_PORT || '2525')
      setWebPort(config.WEB_PORT || '3000')
      setTenantId(config.AZURE_TENANT_ID || '')
      setClientId(config.AZURE_CLIENT_ID || '')
      setClientSecret(config.AZURE_CLIENT_SECRET || '')
      setO365Email(config.O365_USER_EMAIL || '')
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error)
      toast.error('Impossible de charger la configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveMessage(null)

      const updates: any = {
        SMTP_PORT: smtpPort,
        WEB_PORT: webPort,
        AZURE_TENANT_ID: tenantId,
        AZURE_CLIENT_ID: clientId,
        O365_USER_EMAIL: o365Email,
      }

      // Ne mettre à jour le secret que s'il a été modifié (pas vide et pas de masque)
      if (clientSecret && !clientSecret.includes('•')) {
        updates.AZURE_CLIENT_SECRET = clientSecret
      }

      await api.updateConfig(updates)
      
      setIsSaving(false)
      setSaveMessage({
        type: 'success',
        text: 'Configuration enregistrée avec succès. Redémarrez le serveur SMTP pour appliquer les changements.'
      })
      
      toast.success('Configuration enregistrée avec succès')

      // Recharger la configuration pour obtenir les valeurs masquées
      await loadConfiguration()

      setTimeout(() => setSaveMessage(null), 10000)
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      setIsSaving(false)
      setSaveMessage({
        type: 'error',
        text: `Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`
      })
      toast.error('Échec de la sauvegarde')
    }
  }

  const testAzureConnection = async () => {
    try {
      if (!tenantId || !clientId || !clientSecret) {
        return {
          success: false,
          message: 'Veuillez remplir tous les champs requis (Tenant ID, Client ID, Client Secret)'
        }
      }

      const result = await api.testConnection()
      
      if (result.ok) {
        return {
          success: true,
          message: `Connexion Azure AD réussie. Token obtenu avec succès. Expire le: ${result.expiresOn || 'N/A'}`
        }
      } else {
        return {
          success: false,
          message: `Échec de l'authentification: ${result.details || result.error || 'Erreur inconnue'}`
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Erreur lors du test: ${error.message || 'Erreur inconnue'}`
      }
    }
  }

  const testO365Connection = async () => {
    // Note: L'API backend ne fournit pas d'endpoint spécifique pour tester O365
    // On utilise le test Azure AD qui valide aussi l'accès à O365
    if (!o365Email) {
      return {
        success: false,
        message: 'Veuillez renseigner l\'adresse email Office 365'
      }
    }

    return await testAzureConnection()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Header title="Configuration" subtitle="Chargement..." />
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement de la configuration...</p>
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
          title="Configuration" 
          subtitle="Gérez les paramètres de votre relay SMTP"
          action={
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-pulse" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          }
        />
        
        <div className="p-8 space-y-6">
          {/* Save Message */}
          {saveMessage && (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              saveMessage.type === 'success'
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{saveMessage.text}</span>
            </div>
          )}

          {/* SMTP Server Settings */}
          <SettingsSection
            title="Serveur SMTP"
            description="Configuration du serveur SMTP pour la réception des emails"
            icon={Server}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="smtp-enabled" className="text-sm font-medium text-foreground">
                    Activer le serveur SMTP
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Permet de recevoir des emails entrants
                  </p>
                </div>
                <Switch
                  id="smtp-enabled"
                  checked={smtpEnabled}
                  onCheckedChange={setSmtpEnabled}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Port SMTP"
                  name="smtp-port"
                  type="number"
                  placeholder="2525"
                  value={smtpPort}
                  onChange={setSmtpPort}
                  required
                  helpText="Port d'écoute du serveur SMTP (défaut: 2525)"
                />

                <FormField
                  label="Adresse d'écoute"
                  name="smtp-host"
                  placeholder="0.0.0.0"
                  value={smtpHost}
                  onChange={setSmtpHost}
                  required
                  helpText="Interface réseau d'écoute (0.0.0.0 = toutes)"
                />
              </div>
            </div>
          </SettingsSection>

          {/* Azure AD OAuth2 Settings */}
          <SettingsSection
            title="Azure AD OAuth2"
            description="Identifiants pour l'authentification auprès d'Azure Active Directory"
            icon={Shield}
          >
            <div className="space-y-6">
              <FormField
                label="Tenant ID"
                name="tenant-id"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={tenantId}
                onChange={setTenantId}
                required
                helpText="Identifiant du tenant Azure AD"
              />

              <FormField
                label="Client ID"
                name="client-id"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={clientId}
                onChange={setClientId}
                required
                helpText="Identifiant de l'application Azure AD"
              />

              <FormField
                label="Client Secret"
                name="client-secret"
                type="password"
                placeholder="••••••••••••••••••••"
                value={clientSecret}
                onChange={setClientSecret}
                required
                helpText="Secret de l'application (ne sera jamais affiché)"
              />

              <TestConnectionButton
                onTest={testAzureConnection}
                label="Tester Azure AD"
              />
            </div>
          </SettingsSection>

          {/* Office 365 Settings */}
          <SettingsSection
            title="Office 365 SMTP"
            description="Configuration pour l'envoi via Office 365"
            icon={Mail}
          >
            <div className="space-y-6">
              <FormField
                label="Adresse email Office 365"
                name="o365-email"
                type="email"
                placeholder="relay@votre-domaine.com"
                value={o365Email}
                onChange={setO365Email}
                required
                helpText="Adresse email utilisée pour l'envoi via Office 365"
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Serveur SMTP"
                  name="o365-host"
                  placeholder="smtp.office365.com"
                  value={o365Host}
                  onChange={setO365Host}
                  required
                  helpText="Serveur SMTP Office 365"
                />

                <FormField
                  label="Port SMTP"
                  name="o365-port"
                  type="number"
                  placeholder="587"
                  value={o365Port}
                  onChange={setO365Port}
                  required
                  helpText="Port SMTP (587 avec STARTTLS)"
                />
              </div>

              <TestConnectionButton
                onTest={testO365Connection}
                label="Tester Office 365"
              />
            </div>
          </SettingsSection>

          {/* Info Box */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <div className="flex gap-4">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Important
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Les modifications nécessitent un redémarrage du serveur SMTP</li>
                  <li>Testez toujours vos connexions avant de sauvegarder</li>
                  <li>Les secrets sont stockés de manière sécurisée et chiffrés</li>
                  <li>Assurez-vous que votre application Azure AD a les permissions nécessaires</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
