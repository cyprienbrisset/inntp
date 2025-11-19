# 🔌 Intégration API - Frontend Next.js avec Backend SMTP Relay

## 📋 Vue d'ensemble

Ce document décrit l'intégration complète entre le frontend Next.js et l'API REST du backend Express du relay SMTP Office 365.

### Date de mise à jour
**2025-11-19** - Intégration complète de toutes les pages avec l'API backend

---

## ✅ État de l'intégration

### Pages intégrées
- ✅ **Dashboard** (`/`) - Statistiques en temps réel depuis la base SQLite
- ✅ **Emails** (`/emails`) - Liste, filtres, pagination, détails, envoi/retry
- ✅ **Configuration** (`/settings`) - Lecture/écriture de la configuration, test Azure AD
- ✅ **Logs Système** (`/logs`) - Logs en temps réel avec auto-refresh

### Composants intégrés
- ✅ **ServerStatus** - Statut SMTP, redémarrage, connexion DB
- ✅ **RecentEmails** - 5 derniers emails avec formatage de dates
- ✅ **ActivityChart** - Graphique d'activité sur 24h avec agrégation
- ✅ **Toaster** - Notifications toast pour tous les retours utilisateur

---

## 🔗 Endpoints API utilisés

### 1. Statut du serveur
```typescript
GET /api/status
→ api.getStatus()

Response: {
  smtp: { running: boolean, port: number },
  db: { ok: boolean },
  totals: { emails: number },
  version: string
}
```

**Utilisé dans :**
- Dashboard (stats globales)
- ServerStatus (affichage statut)

---

### 2. Liste des emails
```typescript
GET /api/emails?limit=50&offset=0&status=sent&from=&to=&q=
→ api.getEmails({ limit, offset, status, from, to, q })

Response: {
  items: Email[],
  limit: number,
  offset: number,
  filters: { status?, from?, to?, q? }
}
```

**Utilisé dans :**
- Dashboard (statistiques, emails récents, graphique)
- Page Emails (liste complète avec filtres)

---

### 3. Détail d'un email
```typescript
GET /api/emails/:id
→ api.getEmail(id)

Response: Email {
  id: number,
  from_address: string,
  to_addresses: string,
  subject: string,
  received_at: string,
  status: string,
  size_bytes: number,
  body_text?: string,
  body_html?: string,
  cc_addresses?: string,
  bcc_addresses?: string,
  attachments_meta?: string,
  raw_eml?: string
}
```

**Utilisé dans :**
- Page Emails (modal de détail)

---

### 4. Envoyer un email
```typescript
POST /api/emails/:id/send
→ api.sendEmail(id)

Response: {
  ok: boolean,
  messageId?: string,
  response?: string,
  error?: string
}
```

**Utilisé dans :**
- Page Emails (action "Envoyer")

---

### 5. Réessayer l'envoi d'un email
```typescript
POST /api/emails/:id/retry
→ api.retryEmail(id)

Response: {
  ok: boolean,
  messageId?: string,
  response?: string,
  error?: string
}
```

**Utilisé dans :**
- Page Emails (action "Réessayer")

---

### 6. Configuration
```typescript
GET /api/config
→ api.getConfig()

Response: {
  config: {
    SMTP_PORT: string,
    WEB_PORT: string,
    AZURE_TENANT_ID: string,
    AZURE_CLIENT_ID: string,
    AZURE_CLIENT_SECRET: string (masqué),
    O365_USER_EMAIL: string
  }
}
```

**Utilisé dans :**
- Page Configuration (chargement initial)

---

### 7. Mise à jour de la configuration
```typescript
PUT /api/config
Body: Partial<Config>
→ api.updateConfig(updates)

Response: {
  ok: boolean,
  config: Config
}
```

**Utilisé dans :**
- Page Configuration (sauvegarde)

---

### 8. Test de connexion Azure AD
```typescript
POST /api/config/test
→ api.testConnection()

Response: {
  ok: boolean,
  provider?: string,
  expiresOn?: string,
  scope?: string,
  error?: string,
  details?: string
}
```

**Utilisé dans :**
- Page Configuration (test de connexion)

---

### 9. Redémarrer le serveur SMTP
```typescript
POST /api/smtp/restart
→ api.restartSmtp()

Response: {
  ok: boolean,
  port: number
}
```

**Utilisé dans :**
- ServerStatus (bouton redémarrage)

---

### 10. Logs système
```typescript
GET /api/logs/system
→ api.getSystemLogs()

Response: {
  items: SystemLog[] {
    id: number,
    level: string,
    component: string,
    message: string,
    created_at: string,
    details?: string
  }
}
```

**Utilisé dans :**
- Page Logs (affichage et auto-refresh)

---

## 🎯 Fonctionnalités implémentées

### Dashboard
- **Métriques en temps réel** : Emails envoyés, échecs, en attente, taux de succès
- **Graphique d'activité 24h** : Agrégation par heure des emails sent/failed
- **5 derniers emails** : Liste cliquable avec formatage de dates relatif (date-fns)
- **Statut serveur** : État SMTP, port, base de données, total emails

### Page Emails
- **Chargement dynamique** : Pagination côté serveur (50 emails/page)
- **Filtres** : Par statut (sent/failed/pending/received), recherche full-text
- **Actions** : Envoi et retry avec feedback toast
- **Modal détail** : Affichage complet (headers, body, attachments metadata)

### Page Configuration
- **Chargement de la config** : Depuis la base SQLite
- **Sauvegarde** : Mise à jour avec gestion des secrets masqués
- **Test Azure AD** : Validation des credentials avec affichage du token expiry
- **Avertissements** : Message pour redémarrer SMTP après changements

### Page Logs
- **Auto-refresh** : Rafraîchissement automatique toutes les 5 secondes
- **Filtres** : Par niveau (info/warning/error/debug), recherche
- **Export** : Export en fichier texte avec timestamp
- **Statistiques** : Compteur par niveau de log

---

## 🚀 Configuration

### Variables d'environnement

**Frontend (Next.js)**
```env
# .env.local ou .env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Backend (Express)**
```env
# Déjà configuré dans le .env du projet racine
WEB_PORT=3000
SMTP_PORT=2525
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
O365_USER_EMAIL=...
```

### Proxy API (next.config.mjs)

Le frontend Next.js configure automatiquement un proxy pour les requêtes `/api/*` :

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

---

## 📦 Dépendances ajoutées

### Frontend
- ✅ `date-fns` : Formatage de dates (déjà installé)
- ✅ `sonner` : Notifications toast (déjà installé)
- ✅ `next-themes` : Gestion du thème dark/light (déjà installé)

### Types
Tous les types TypeScript sont définis dans `frontend/lib/api.ts` :
- `ServerStatus`
- `Email`
- `EmailsResponse`
- `SystemLog`
- `SystemLogsResponse`
- `Config`
- `ConfigResponse`
- `TestConnectionResponse`
- `SendEmailResponse`

---

## 🧪 Tests suggérés

### 1. Test du Dashboard
```bash
# Démarrer le backend
npm run dev:backend

# Dans un autre terminal, démarrer le frontend
npm run dev:frontend

# Ouvrir http://localhost:3001
# Vérifier que les statistiques s'affichent
# Vérifier que le graphique montre les données réelles
```

### 2. Test de la page Emails
```bash
# Ajouter des emails de test via le serveur SMTP (port 2525)
# Vérifier la pagination
# Tester les filtres (statut, recherche)
# Cliquer sur un email pour voir le détail
# Tester l'envoi et le retry
```

### 3. Test de la Configuration
```bash
# Charger la page /settings
# Vérifier que les valeurs sont chargées
# Modifier une valeur
# Cliquer sur "Tester Azure AD"
# Sauvegarder
# Vérifier que les valeurs sont masquées après reload
```

### 4. Test des Logs
```bash
# Charger la page /logs
# Vérifier que les logs s'affichent
# Activer l'auto-refresh
# Vérifier qu'ils se rafraîchissent toutes les 5s
# Tester les filtres
# Tester l'export
```

---

## 🔧 Dépannage

### Le frontend ne se connecte pas au backend

**Vérifier :**
1. Le backend est bien démarré sur le port 3000
2. La variable `NEXT_PUBLIC_API_URL` est correcte
3. Le proxy dans `next.config.mjs` est configuré
4. Pas de CORS bloquant (normalement géré par le proxy)

**Solution :**
```bash
# Vérifier le backend
curl http://localhost:3000/api/status

# Vérifier le proxy frontend
curl http://localhost:3001/api/status
```

---

### Les toasts ne s'affichent pas

**Vérifier :**
1. Le `<Toaster />` est dans le layout (`app/layout.tsx`)
2. `sonner` est installé : `npm list sonner` dans le dossier frontend

**Solution :**
```typescript
// app/layout.tsx doit contenir
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

---

### Les dates ne s'affichent pas en français

**Vérifier :**
1. `date-fns` est installé
2. L'import de locale est correct : `import { fr } from 'date-fns/locale'`

**Solution :**
```typescript
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const formatted = formatDistanceToNow(date, { 
  addSuffix: true, 
  locale: fr 
})
```

---

### Les emails ne se chargent pas

**Vérifier :**
1. La base de données SQLite existe : `data/relay.db`
2. Le backend a accès en lecture à la DB
3. Il y a des emails dans la table `emails`

**Solution :**
```bash
# Vérifier la DB
sqlite3 data/relay.db "SELECT COUNT(*) FROM emails;"

# Redémarrer le backend
npm run dev:backend
```

---

## 📈 Améliorations futures

### Court terme
- [ ] Ajouter un cache côté client (React Query / SWR)
- [ ] Implémenter un websocket pour les notifications temps réel
- [ ] Ajouter un loader skeleton au lieu du spinner
- [ ] Pagination avec nombre total exact d'emails

### Moyen terme
- [ ] Export CSV des emails
- [ ] Graphiques avancés avec plus de métriques
- [ ] Recherche avancée avec opérateurs
- [ ] Gestion des pièces jointes (téléchargement)

### Long terme
- [ ] Mode hors ligne avec service worker
- [ ] Dashboard customisable (widgets)
- [ ] Alertes configurables
- [ ] Multi-langue (i18n)

---

## 📚 Références

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [API Backend](../src/web/app.ts)
- [README principal](../README.md)
- [Documentation technique](../documentations/technicals.md)

### Composants UI
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités :

1. **Créer l'endpoint API** dans `src/web/app.ts`
2. **Ajouter les types** dans `frontend/lib/api.ts`
3. **Créer la fonction API** dans `frontend/lib/api.ts`
4. **Utiliser dans les composants** avec `useEffect` et `useState`
5. **Ajouter les toasts** pour le feedback utilisateur
6. **Documenter** dans ce fichier

---

**Dernière mise à jour :** 2025-11-19  
**Auteur :** Junie AI Assistant  
**Version :** 1.0.0
