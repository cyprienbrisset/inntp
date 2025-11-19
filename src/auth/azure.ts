import { ConfidentialClientApplication, Configuration } from '@azure/msal-node'
import type { DB } from '../database/db'

type TokenResult = { expiresOn: string; scope: string }
export type AccessToken = { accessToken: string; expiresOn: Date }

let appCache: ConfidentialClientApplication | null = null
let lastCfgKey = ''
let tokenCache: { key: string; accessToken: string; expiresOn: Date } | null = null

function buildMsal(cfg: Record<string, string>) {
  const tenant = cfg.AZURE_TENANT_ID || process.env.AZURE_TENANT_ID || ''
  const clientId = cfg.AZURE_CLIENT_ID || process.env.AZURE_CLIENT_ID || ''
  const clientSecret = cfg.AZURE_CLIENT_SECRET || process.env.AZURE_CLIENT_SECRET || ''
  if (!tenant || !clientId || !clientSecret) {
    throw new Error('Configuration Azure AD incomplète (TENANT/CLIENT_ID/CLIENT_SECRET)')
  }
  const authority = `https://login.microsoftonline.com/${tenant}`
  const conf: Configuration = {
    auth: {
      clientId,
      authority,
      clientSecret
    },
    system: { loggerOptions: { loggerCallback: () => {} } }
  }
  return { conf, key: `${tenant}|${clientId}` }
}

export async function testAzureToken(db: DB, cfg: Record<string, string>): Promise<TokenResult> {
  const { conf, key } = buildMsal(cfg)
  if (!appCache || key !== lastCfgKey) {
    appCache = new ConfidentialClientApplication(conf)
    lastCfgKey = key
    tokenCache = null
  }

  // Scope pour SMTP AUTH/O365: utiliser le resource .default d'Outlook
  const scopes = [ 'https://outlook.office365.com/.default' ]
  try {
    const res = await appCache.acquireTokenByClientCredential({ scopes })
    if (!res || !res.expiresOn) throw new Error('Aucun token reçu')
    // journaliser succès
    db.prepare('INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ?)').run(
      'info',
      'oauth',
      'Token Azure acquis (test)',
      JSON.stringify({ expiresOn: res.expiresOn.toISOString(), tenant: (cfg.AZURE_TENANT_ID || '').slice(0, 6) + '…' })
    )
    return { expiresOn: res.expiresOn.toISOString(), scope: scopes.join(' ') }
  } catch (e: any) {
    // journaliser erreur
    db.prepare('INSERT INTO system_logs (level, component, message, details) VALUES (?, ?, ?, ?)').run(
      'error',
      'oauth',
      'Echec acquisition token (test)',
      JSON.stringify({ err: String(e && e.message ? e.message : e) })
    )
    throw e
  }
}

// Invalider explicitement le cache (utile après erreur d'auth)
export function invalidateAzureTokenCache() {
  tokenCache = null
}

// Retourne un accessToken utilisable pour SMTP AUTH XOAUTH2 (avec cache + renouvellement anticipé)
export async function acquireAzureAccessToken(cfg: Record<string, string>): Promise<AccessToken> {
  const { conf, key } = buildMsal(cfg)
  if (!appCache || key !== lastCfgKey) {
    appCache = new ConfidentialClientApplication(conf)
    lastCfgKey = key
    tokenCache = null
  }
  const scopes = [ 'https://outlook.office365.com/.default' ]
  // Vérifier cache (skew 120s)
  const now = Date.now()
  const skewMs = 120 * 1000
  if (tokenCache && tokenCache.key === key && tokenCache.expiresOn.getTime() - now > skewMs) {
    return { accessToken: tokenCache.accessToken, expiresOn: tokenCache.expiresOn }
  }
  const res = await appCache.acquireTokenByClientCredential({ scopes })
  if (!res || !res.accessToken || !res.expiresOn) throw new Error('Echec obtention accessToken Azure')
  tokenCache = { key, accessToken: res.accessToken, expiresOn: res.expiresOn }
  return { accessToken: res.accessToken, expiresOn: res.expiresOn }
}
