# 🎨 Frontend Next.js - SMTP Relay Office 365

Interface web moderne pour le monitoring et la gestion du relay SMTP Office 365.

## 🚀 Technologies

- **Next.js 16** avec App Router
- **React 19**
- **TypeScript**
- **shadcn/ui** + **Radix UI** pour les composants
- **Tailwind CSS** pour le styling
- **Recharts** pour les graphiques
- **Lucide React** pour les icônes
- **Sonner** pour les notifications toast
- **React Hook Form** + **Zod** pour les formulaires

## 📁 Structure du projet

```
frontend/
├── app/                    # Pages (App Router)
│   ├── page.tsx           # Dashboard
│   ├── emails/page.tsx    # Gestion des emails
│   ├── logs/page.tsx      # Logs système
│   ├── settings/page.tsx  # Configuration
│   ├── layout.tsx         # Layout principal
│   └── globals.css        # Styles globaux
│
├── components/            # Composants React
│   ├── ui/               # Composants UI de base (shadcn/ui)
│   ├── header.tsx        # En-tête de page
│   ├── sidebar.tsx       # Navigation latérale
│   ├── metric-card.tsx   # Carte de métrique
│   ├── server-status.tsx # Statut SMTP
│   ├── activity-chart.tsx # Graphique d'activité
│   ├── recent-emails.tsx  # Emails récents
│   ├── email-table.tsx    # Tableau des emails
│   ├── email-filters.tsx  # Filtres emails
│   ├── email-detail-modal.tsx # Modal détail
│   ├── log-viewer.tsx     # Visualisation logs
│   ├── log-filters.tsx    # Filtres logs
│   ├── settings-section.tsx # Configuration
│   └── test-connection-button.tsx # Test connexion
│
├── lib/                   # Utilitaires
│   ├── api.ts            # Client API (⭐ IMPORTANT)
│   └── utils.ts          # Helpers
│
├── hooks/                 # Custom React hooks
│
├── styles/                # Styles additionnels
│
├── public/                # Assets statiques
│
├── .env.local            # Variables d'environnement
├── next.config.mjs       # Configuration Next.js
├── tailwind.config.ts    # Configuration Tailwind
├── tsconfig.json         # Configuration TypeScript
└── package.json          # Dépendances

```

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env.local` :

```env
# URL de l'API backend (Express)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Port du serveur Next.js
PORT=3001
```

## 🏃 Commandes

```bash
# Installation des dépendances
npm install
# ou
pnpm install

# Développement (port 3001)
npm run dev

# Build de production
npm run build

# Démarrage en production
npm start

# Linting
npm run lint
```

## 📡 Client API

Le fichier `lib/api.ts` contient le client API complet pour communiquer avec le backend Express.

### Import

```typescript
import { api } from '@/lib/api'
import type { Email, ServerStatus, Config } from '@/lib/api'
```

### Méthodes disponibles

#### Statut du serveur

```typescript
const status = await api.getStatus()
// Retourne: { smtp: { running, port }, db: { ok }, totals: { emails }, version }
```

#### Gestion des emails

```typescript
// Liste avec filtres et pagination
const response = await api.getEmails({
  limit: 50,
  offset: 0,
  status: 'sent',      // 'pending', 'sent', 'failed'
  from: 'user@example.com',
  to: 'dest@example.com',
  q: 'recherche'       // Recherche dans sujet et contenu
})

// Détail d'un email
const email = await api.getEmail(123)

// Envoyer un email vers Office 365
const result = await api.sendEmail(123)
// Retourne: { ok, messageId, response }

// Réessayer l'envoi
const result = await api.retryEmail(123)
```

#### Logs système

```typescript
const logs = await api.getSystemLogs()
// Retourne: { items: [...] }
```

#### Configuration

```typescript
// Lire la configuration
const config = await api.getConfig()

// Mettre à jour la configuration
await api.updateConfig({
  SMTP_PORT: '2525',
  AZURE_TENANT_ID: 'xxx',
  // ...
})

// Tester la connexion Azure AD
const result = await api.testConnection()
// Retourne: { ok, provider, expiresOn, scope }
```

#### Gestion du serveur SMTP

```typescript
// Redémarrer le serveur SMTP
await api.restartSmtp()
// Retourne: { ok, port }
```

## 🎨 Composants UI (shadcn/ui)

Le projet utilise shadcn/ui, une collection de composants réutilisables basés sur Radix UI.

### Composants disponibles

- `Button` - Boutons avec variantes
- `Card` - Cartes de contenu
- `Table` - Tableaux de données
- `Dialog` / `Modal` - Fenêtres modales
- `Select` - Menus déroulants
- `Input` - Champs de saisie
- `Badge` - Badges et tags
- `Toast` - Notifications
- `Tabs` - Onglets
- `Checkbox` - Cases à cocher
- `Switch` - Interrupteurs
- Et plus encore...

### Exemple d'utilisation

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Titre</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default" onClick={() => console.log('Click')}>
          Action
        </Button>
      </CardContent>
    </Card>
  )
}
```

## 📄 Pages

### Dashboard (`/`)

- Métriques clés (emails envoyés, échecs, en attente, taux de succès)
- Statut du serveur SMTP
- Graphique d'activité des 7 derniers jours
- Liste des emails récents

### Emails (`/emails`)

- Tableau des emails avec filtres avancés
- Pagination
- Actions : voir détail, envoyer, retry
- Recherche full-text
- Filtres par statut, expéditeur, destinataire

### Logs (`/logs`)

- Visualisation des logs système en temps réel
- Filtres par niveau (info, warn, error)
- Auto-refresh configurable
- Recherche dans les logs

### Settings (`/settings`)

- Configuration du serveur SMTP
- Configuration Azure AD
- Configuration Office 365
- Test de connexion
- Bouton de redémarrage du serveur

## 🎯 Bonnes pratiques

### 1. Utiliser les types TypeScript

```typescript
import type { Email, ServerStatus } from '@/lib/api'

const [emails, setEmails] = useState<Email[]>([])
const [status, setStatus] = useState<ServerStatus | null>(null)
```

### 2. Gérer les erreurs

```typescript
try {
  await api.sendEmail(id)
  toast.success('Email envoyé !')
} catch (error) {
  toast.error(`Erreur : ${error.message}`)
}
```

### 3. Loading states

```typescript
const [loading, setLoading] = useState(false)

const handleAction = async () => {
  setLoading(true)
  try {
    await api.someAction()
  } finally {
    setLoading(false)
  }
}

return <Button disabled={loading}>Action</Button>
```

### 4. Auto-refresh avec cleanup

```typescript
useEffect(() => {
  const load = async () => {
    const data = await api.getStatus()
    setStatus(data)
  }
  
  load()
  const interval = setInterval(load, 5000)
  
  return () => clearInterval(interval) // Cleanup
}, [])
```

## 🔧 Personnalisation

### Thème

Le thème est configurable dans `app/globals.css` :

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  /* ... */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### Tailwind

Configuration dans `tailwind.config.ts` pour ajouter des couleurs, espacements, etc.

## 🚀 Déploiement

### Build

```bash
npm run build
```

Génère le dossier `.next/` avec l'application optimisée.

### Production

```bash
npm start
```

Démarre le serveur Next.js en mode production (après build).

### Variables d'environnement en production

Assurez-vous de définir :

```env
NEXT_PUBLIC_API_URL=https://api.votredomaine.com
PORT=3001  # ou autre
```

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation shadcn/ui](https://ui.shadcn.com/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation Radix UI](https://www.radix-ui.com/)
- [Documentation Recharts](https://recharts.org/)

## 🔗 Liens utiles

- [README principal](../README.md) - Documentation complète du projet
- [INTEGRATION.md](../INTEGRATION.md) - Guide d'intégration frontend/backend
- [Documentation technique](../documentations/technicals.md) - Cahier des charges

## 🆘 Support

Pour toute question ou problème :

1. Vérifiez que le backend tourne sur le port 3000
2. Vérifiez `.env.local` pour l'URL de l'API
3. Consultez les DevTools (Network tab) pour les erreurs API
4. Consultez la documentation d'intégration dans `INTEGRATION.md`
