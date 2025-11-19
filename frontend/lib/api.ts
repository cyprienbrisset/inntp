/**
 * Configuration et helpers pour l'API du relay SMTP
 */

// URL de l'API backend (Express)
// En développement, Next.js tourne sur 3001 et le backend sur 3000
// En production, ils peuvent être sur le même port via un reverse proxy
// Utiliser une URL relative pour que les rewrites Next.js fonctionnent
const API_BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000')

/**
 * Interface pour le statut du serveur
 */
export interface ServerStatus {
  smtp: {
    running: boolean
    port: number
  }
  db: {
    ok: boolean
  }
  totals: {
    emails: number
  }
  version: string
}

/**
 * Interface pour un email
 */
export interface Email {
  id: number
  from_address: string
  to_addresses: string
  subject: string
  received_at: string
  status: string
  size_bytes: number
  body_text?: string
  body_html?: string
  cc_addresses?: string
  bcc_addresses?: string
  attachments_meta?: string
  raw_eml?: string
}

/**
 * Interface pour la liste d'emails
 */
export interface EmailsResponse {
  items: Email[]
  limit: number
  offset: number
  filters: {
    status?: string
    from?: string
    to?: string
    q?: string
  }
}

/**
 * Interface pour un log système
 */
export interface SystemLog {
  id: number
  level: string
  component: string
  message: string
  created_at: string
  details?: string
}

/**
 * Interface pour les logs système
 */
export interface SystemLogsResponse {
  items: SystemLog[]
}

/**
 * Interface pour la configuration
 */
export interface Config {
  SMTP_PORT: string
  WEB_PORT: string
  AZURE_TENANT_ID: string
  AZURE_CLIENT_ID: string
  AZURE_CLIENT_SECRET: string
  O365_USER_EMAIL: string
}

/**
 * Interface pour la réponse de configuration
 */
export interface ConfigResponse {
  config: Config
}

/**
 * Interface pour le test de connexion
 */
export interface TestConnectionResponse {
  ok: boolean
  provider?: string
  expiresOn?: string
  scope?: string
  error?: string
  details?: string
}

/**
 * Interface pour la réponse d'envoi d'email
 */
export interface SendEmailResponse {
  ok: boolean
  messageId?: string
  response?: string
  error?: string
}

/**
 * Helper pour effectuer des requêtes à l'API
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown_error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * API Client pour le relay SMTP
 */
export const api = {
  /**
   * Obtenir le statut du serveur
   */
  getStatus: () => apiRequest<ServerStatus>('/api/status'),

  /**
   * Obtenir la liste des emails
   */
  getEmails: (params?: {
    limit?: number
    offset?: number
    status?: string
    from?: string
    to?: string
    q?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))
    if (params?.status) searchParams.set('status', params.status)
    if (params?.from) searchParams.set('from', params.from)
    if (params?.to) searchParams.set('to', params.to)
    if (params?.q) searchParams.set('q', params.q)

    const query = searchParams.toString()
    return apiRequest<EmailsResponse>(`/api/emails${query ? `?${query}` : ''}`)
  },

  /**
   * Obtenir le détail d'un email
   */
  getEmail: (id: number) => apiRequest<Email>(`/api/emails/${id}`),

  /**
   * Obtenir les logs système
   */
  getSystemLogs: () => apiRequest<SystemLogsResponse>('/api/logs/system'),

  /**
   * Obtenir la configuration
   */
  getConfig: () => apiRequest<ConfigResponse>('/api/config'),

  /**
   * Mettre à jour la configuration
   */
  updateConfig: (config: Partial<Config>) =>
    apiRequest<ConfigResponse>('/api/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  /**
   * Tester la connexion Azure AD
   */
  testConnection: () =>
    apiRequest<TestConnectionResponse>('/api/config/test', {
      method: 'POST',
    }),

  /**
   * Envoyer un email via Office 365
   */
  sendEmail: (id: number) =>
    apiRequest<SendEmailResponse>(`/api/emails/${id}/send`, {
      method: 'POST',
    }),

  /**
   * Réessayer l'envoi d'un email
   */
  retryEmail: (id: number) =>
    apiRequest<SendEmailResponse>(`/api/emails/${id}/retry`, {
      method: 'POST',
    }),

  /**
   * Redémarrer le serveur SMTP
   */
  restartSmtp: () =>
    apiRequest<{ ok: boolean; port: number }>('/api/smtp/restart', {
      method: 'POST',
    }),
}
