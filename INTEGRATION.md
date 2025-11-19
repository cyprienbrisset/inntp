# 🔗 Guide d'Intégration - Frontend Next.js & Backend Express

## 📋 Vue d'ensemble

Ce document explique comment le frontend Next.js s'intègre avec le backend Express du relay SMTP.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│                     Port 3001                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Pages (App Router)                              │   │
│  │  • app/page.tsx (Dashboard)                      │   │
│  │  • app/emails/page.tsx (Liste emails)            │   │
│  │  • app/logs/page.tsx (Logs système)              │   │
│  │  • app/settings/page.tsx (Configuration)         │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Client (lib/api.ts)                         │   │
│  │  • Interfaces TypeScript pour les données        │   │
│  │  • Méthodes pour appeler l'API backend          │   │
│  │  • Gestion des erreurs                           │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST
                         │ /api/*
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Express)                       │
│                     Port 3000                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Routes (src/web/app.ts)                     │   │
│  │  • GET  /api/status                              │   │
│  │  • GET  /api/emails                              │   │
│  │  • GET  /api/emails/:id                          │   │
│  │  • POST /api/emails/:id/send                     │   │
│  │  • POST /api/emails/:id/retry                    │   │
│  │  • GET  /api/logs/system                         │   │
│  │  • GET  /api/config                              │   │
│  │  • PUT  /api/config                              │   │
│  │  • POST /api/config/test                         │   │
│  │  • POST /api/smtp/restart                        │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Business Logic                                  │   │
│  │  • Serveur SMTP (port 2525)                      │   │
│  │  • Parser d'emails (mailparser)                  │   │
│  │  • Base de données SQLite                        │   │
│  │  • OAuth2 Azure AD (MSAL)                        │   │
│  │  • Client SMTP Office 365 (nodemailer)          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Configuration

### Variables d'environnement

#### Backend (.env à la racine)

```env
# Serveurs
SMTP_PORT=2525
WEB_PORT=3000

# Azure AD
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
AZURE_CLIENT_SECRET=votre-secret-client

# Office 365
O365_USER_EMAIL=expediteur@votredomaine.com

# Base de données
DB_PATH=./data/relay.db
```

#### Frontend (frontend/.env.local)

```env
# URL de l'API backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Port du serveur Next.js
PORT=3001
```

### Proxy API

Le fichier `frontend/next.config.mjs` configure un rewrite pour proxifier les requêtes :

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/:path*',
    },
  ]
}
```

Cela permet au frontend de faire des requêtes vers `/api/*` qui seront automatiquement redirigées vers le backend sur le port 3000.

## 📡 Client API

Le fichier `frontend/lib/api.ts` expose un client API complet :

### Interfaces TypeScript

```typescript
// Statut du serveur
interface ServerStatus {
  smtp: { running: boolean; port: number }
  db: { ok: boolean }
  totals: { emails: number }
  version: string
}

// Email
interface Email {
  id: number
  from_address: string
  to_addresses: string
  subject: string
  received_at: string
  status: string
  size_bytes: number
  body_text?: string
  body_html?: string
  // ...
}

// Configuration
interface Config {
  SMTP_PORT: string
  WEB_PORT: string
  AZURE_TENANT_ID: string
  AZURE_CLIENT_ID: string
  AZURE_CLIENT_SECRET: string
  O365_USER_EMAIL: string
}
```

### Méthodes disponibles

```typescript
import { api } from '@/lib/api'

// Obtenir le statut
const status = await api.getStatus()

// Liste des emails avec filtres
const emails = await api.getEmails({
  limit: 50,
  offset: 0,
  status: 'sent',
  from: 'user@example.com',
  q: 'recherche'
})

// Détail d'un email
const email = await api.getEmail(123)

// Logs système
const logs = await api.getSystemLogs()

// Configuration
const config = await api.getConfig()
await api.updateConfig({ SMTP_PORT: '2525' })
await api.testConnection()

// Actions sur les emails
await api.sendEmail(123)
await api.retryEmail(123)

// Gestion SMTP
await api.restartSmtp()
```

## 🎨 Composants Frontend

### Structure des composants

```
frontend/components/
├── ui/                      # Composants UI de base (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── table.tsx
│   └── ...
│
├── header.tsx              # En-tête de page
├── sidebar.tsx             # Navigation latérale
├── metric-card.tsx         # Carte de métrique (Dashboard)
├── server-status.tsx       # Statut du serveur SMTP
├── activity-chart.tsx      # Graphique d'activité
├── recent-emails.tsx       # Liste des emails récents
├── email-table.tsx         # Tableau des emails
├── email-filters.tsx       # Filtres pour les emails
├── email-detail-modal.tsx  # Modal de détail d'email
├── log-viewer.tsx          # Visualisation des logs
├── log-filters.tsx         # Filtres pour les logs
├── settings-section.tsx    # Section de configuration
└── test-connection-button.tsx  # Bouton de test de connexion
```

### Exemple d'utilisation

```typescript
'use client'

import { useState, useEffect } from 'react'
import { api, type ServerStatus } from '@/lib/api'
import { ServerStatus } from '@/components/server-status'

export default function DashboardPage() {
  const [status, setStatus] = useState<ServerStatus | null>(null)
  
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await api.getStatus()
        setStatus(data)
      } catch (error) {
        console.error('Erreur:', error)
      }
    }
    
    loadStatus()
    const interval = setInterval(loadStatus, 5000) // Refresh toutes les 5s
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div>
      {status && <ServerStatus data={status} />}
    </div>
  )
}
```

## 🔧 Scripts npm

### Package.json racine

```json
{
  "scripts": {
    "build": "tsc",                              // Build backend
    "build:frontend": "cd frontend && npm run build",  // Build frontend
    "build:all": "npm run build && npm run build:frontend",  // Build complet
    "start": "node dist/index.js",               // Démarre backend seul
    "dev:backend": "npm run build && npm start", // Dev backend
    "dev:frontend": "cd frontend && npm run dev",// Dev frontend
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",  // Dev complet
    "install:frontend": "cd frontend && npm install"  // Install frontend
  }
}
```

### Commandes de développement

```bash
# Installation complète
npm install                    # Backend
npm run install:frontend       # Frontend

# Développement
npm run dev                    # Backend + Frontend simultanément
npm run dev:backend            # Backend seul (port 3000)
npm run dev:frontend           # Frontend seul (port 3001)

# Build
npm run build                  # Backend seul
npm run build:frontend         # Frontend seul
npm run build:all              # Backend + Frontend

# Production
npm start                      # Backend seul
cd frontend && npm start       # Frontend seul (après build)
```

## 🔄 Flux de données

### Exemple : Envoi d'un email

1. **Frontend** : L'utilisateur clique sur "Envoyer" dans l'interface
2. **Composant** : `email-detail-modal.tsx` appelle `api.sendEmail(id)`
3. **API Client** : `lib/api.ts` envoie `POST /api/emails/:id/send`
4. **Proxy Next.js** : Redirige vers `http://localhost:3000/api/emails/:id/send`
5. **Backend** : `src/web/app.ts` traite la requête
6. **OAuth2** : Obtient un token Azure AD
7. **SMTP O365** : Envoie l'email via `nodemailer`
8. **Database** : Met à jour le statut dans SQLite
9. **Réponse** : Backend retourne `{ ok: true, messageId: '...' }`
10. **Frontend** : Affiche le résultat à l'utilisateur

### Exemple : Auto-refresh du Dashboard

```typescript
useEffect(() => {
  const loadData = async () => {
    const status = await api.getStatus()
    const emails = await api.getEmails({ limit: 10 })
    setStatus(status)
    setEmails(emails.items)
  }
  
  loadData()
  const interval = setInterval(loadData, 5000)
  return () => clearInterval(interval)
}, [])
```

## 🎯 Bonnes pratiques

### 1. Gestion des erreurs

```typescript
try {
  const result = await api.sendEmail(id)
  toast.success('Email envoyé avec succès')
} catch (error) {
  toast.error(`Erreur : ${error.message}`)
  console.error('Erreur détaillée:', error)
}
```

### 2. Loading states

```typescript
const [loading, setLoading] = useState(false)

const handleSend = async () => {
  setLoading(true)
  try {
    await api.sendEmail(id)
  } finally {
    setLoading(false)
  }
}
```

### 3. TypeScript strict

Toutes les interfaces sont typées :
- Utiliser les types exportés depuis `lib/api.ts`
- Activer `strict: true` dans `tsconfig.json`
- Éviter les `any`

### 4. Composants réutilisables

- Utiliser shadcn/ui pour la cohérence visuelle
- Créer des composants métier réutilisables
- Séparer la logique métier de l'UI

## 🚧 Limitations actuelles

1. **Pas d'authentification** : L'interface est accessible sans login
2. **Pas de WebSocket** : Auto-refresh par polling HTTP
3. **CORS** : À configurer pour production si domaines différents
4. **Cache** : Pas de cache côté frontend (React Query à envisager)

## 📦 Déploiement

### Option 1 : Deux serveurs séparés

- Backend sur serveur A (port 3000)
- Frontend sur serveur B (port 3001 ou autre)
- Configurer CORS sur le backend
- Mettre à jour `NEXT_PUBLIC_API_URL` avec l'URL publique du backend

### Option 2 : Reverse proxy (recommandé)

```nginx
server {
  listen 80;
  
  # Frontend Next.js
  location / {
    proxy_pass http://localhost:3001;
  }
  
  # API Backend
  location /api {
    proxy_pass http://localhost:3000;
  }
}
```

### Option 3 : Backend sert le frontend

Build le frontend en mode statique et servir depuis Express :

```typescript
// Dans src/web/app.ts
app.use(express.static('frontend/out'))
```

## 🔍 Debug

### Backend

```bash
# Vérifier que le backend répond
curl http://localhost:3000/api/status

# Logs du backend
npm start  # Les logs s'affichent dans la console
```

### Frontend

```bash
# Vérifier la config
cat frontend/.env.local

# Logs du serveur Next.js
cd frontend && npm run dev

# Inspecter les requêtes dans le navigateur
# DevTools > Network > Filter: /api/
```

### Problèmes courants

**Erreur CORS** : Ajouter CORS au backend Express :

```typescript
import cors from 'cors'
app.use(cors({ origin: 'http://localhost:3001' }))
```

**Port déjà utilisé** : Changer le port dans `.env` ou `frontend/.env.local`

**API non accessible** : Vérifier que `NEXT_PUBLIC_API_URL` pointe vers le bon backend

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Express](https://expressjs.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Documentation du projet](./README.md)
