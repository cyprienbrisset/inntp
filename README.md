# 📮 SMTP Relay Office 365

<div align="center">

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Private-red.svg)]()
[![Status](https://img.shields.io/badge/status-MVP-orange.svg)]()

**Solution moderne de relais SMTP avec interface web pour Office 365**

[Fonctionnalités](#-fonctionnalités) • [Installation](#-installation) • [Configuration](#%EF%B8%8F-configuration) • [Documentation](#-documentation)

</div>

---

## 📖 À propos

**SMTP Relay Office 365** est une application Node.js/TypeScript qui fait le pont entre des applications legacy utilisant le protocole SMTP standard et Office 365 avec authentification OAuth2 via Azure AD.

### Cas d'usage

- 🏢 Connecter des applications anciennes à Office 365
- 🔐 Centraliser l'authentification OAuth2 pour plusieurs services
- 📊 Monitorer et tracer tous les emails envoyés
- 🔍 Debugger les problèmes d'envoi d'emails
- 📈 Analyser les métriques d'envoi

### Architecture

```
┌─────────────────┐
│  Application    │
│    Legacy       │
└────────┬────────┘
         │ SMTP (port 2525)
         │ Sans authentification
         ▼
┌─────────────────────────────────────────────┐
│   SMTP Relay Backend (Node.js + Express)    │
│  ┌─────────────────────────────────────┐    │
│  │  • Serveur SMTP (port 2525)         │    │
│  │  • Parser & SQLite                  │    │
│  │  • API REST (port 3000)             │    │
│  │  • OAuth2 Azure AD                  │    │
│  └─────────────────────────────────────┘    │
└───────────┬─────────────────────────────────┘
            │ API REST
            ▼
┌─────────────────────────────────────────────┐
│   Frontend Next.js (port 3001)              │
│  ┌─────────────────────────────────────┐    │
│  │  • Dashboard moderne avec stats     │    │
│  │  • Gestion des emails               │    │
│  │  • Configuration en ligne           │    │
│  │  • Logs système temps réel          │    │
│  │  • UI avec shadcn/ui + Tailwind     │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
            │
            │ SMTP + OAuth2 (port 587)
            │ TLS/STARTTLS
            ▼
┌─────────────────┐
│  Office 365     │
│  SMTP Server    │
└─────────────────┘
```

---

## ✨ Fonctionnalités

### 🎯 Fonctionnalités principales (MVP)

#### Serveur SMTP
- ✅ Écoute sur port configurable (défaut: 2525)
- ✅ Acceptation sans authentification
- ✅ Parsing complet des emails (texte, HTML, métadonnées)
- ✅ Support des pièces jointes (métadonnées)
- ✅ Persistance automatique dans SQLite

#### Authentification & Envoi
- ✅ OAuth2 via Azure AD (MSAL)
- ✅ Envoi sécurisé vers Office 365 (TLS)
- ✅ Gestion des erreurs et retry manuel
- ✅ Traçabilité complète des envois

#### Interface Web (Next.js)
- ✅ **Frontend moderne** avec Next.js 16 + React 19
- ✅ **Design system** shadcn/ui + Radix UI + Tailwind CSS
- ✅ **Dashboard** avec statistiques en temps réel et graphiques (Recharts)
- ✅ **Gestion des emails** : liste avec filtres avancés, pagination, détail complet
- ✅ **Configuration** en ligne avec masquage des secrets et test de connexion
- ✅ **Logs système** avec filtrage et auto-refresh
- ✅ **Actions** d'envoi et retry depuis l'interface
- ✅ **Thème sombre** par défaut avec mode clair disponible
- ✅ **Navigation** avec sidebar moderne et responsive

#### API REST
- ✅ Endpoints CRUD complets
- ✅ Filtrage avancé (statut, expéditeur, recherche)
- ✅ Pagination optimisée
- ✅ Gestion de configuration dynamique

### 🚧 Roadmap

- [ ] Envoi automatique des pièces jointes
- [ ] File d'attente avec retry automatique
- [ ] WebSocket pour notifications temps réel
- [ ] Métriques quotidiennes et graphiques
- [ ] Exportation des logs (CSV/JSON)
- [ ] Alertes par email en cas d'échec
- [ ] API avancée avec webhooks
- [ ] Authentification sur l'interface web
- [ ] Mode multi-tenant

---

## 🚀 Installation

### Prérequis

- **Node.js** 18.x ou supérieur
- **npm** 9.x ou supérieur
- **Compte Office 365** avec licence Exchange Online
- **Accès Azure AD** (droits d'enregistrement d'application)

### Installation rapide

```bash
# 1. Cloner le repository
git clone <repository-url>
cd documalis-relay

# 2. Installer les dépendances du backend
npm install

# 3. Installer les dépendances du frontend
npm run install:frontend

# 4. Configurer l'environnement backend
cp .env.example .env
nano .env

# 5. Compiler le backend TypeScript
npm run build
```

### Démarrage

#### Mode développement (recommandé)

Lance le backend (port 3000) et le frontend Next.js (port 3001) simultanément :

```bash
npm run dev
```

#### Mode production

Lance uniquement le backend avec l'ancienne interface :

```bash
npm start
```

Pour le frontend en production :

```bash
# Build du frontend
npm run build:frontend

# Démarrage du frontend
cd frontend
npm start
```

### Accès aux interfaces

| Interface | URL | Description |
|-----------|-----|-------------|
| 🌐 **Frontend Next.js** | `http://localhost:3001` | **Interface moderne (recommandée)** |
| 🌐 Interface legacy | `http://localhost:3000` | Ancienne interface minimaliste |
| 🔌 API Backend | `http://localhost:3000/api/status` | API REST |
| 📧 Serveur SMTP | `localhost:2525` | Serveur SMTP |

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# === SERVEURS ===
SMTP_PORT=2525
WEB_PORT=3000

# === AZURE ACTIVE DIRECTORY ===
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
AZURE_CLIENT_SECRET=votre-secret-client

# === OFFICE 365 ===
O365_USER_EMAIL=expediteur@votredomaine.com

# === BASE DE DONNÉES ===
DB_PATH=./data/relay.db

# === LOGS ===
LOG_LEVEL=info
```

### Configuration Azure AD

#### 1. Enregistrer une application

1. Accédez au [Portail Azure](https://portal.azure.com)
2. **Azure Active Directory** → **App registrations** → **New registration**
3. Configurez :
    - **Name**: `SMTP Relay O365`
    - **Supported account types**: Single tenant
    - Cliquez sur **Register**

#### 2. Récupérer les identifiants

- Notez l'**Application (client) ID**
- Notez le **Directory (tenant) ID**
- Allez dans **Certificates & secrets** → **New client secret**
- Copiez la **Value** (secret client)

#### 3. Configurer les permissions

1. **API permissions** → **Add a permission** → **Microsoft Graph**
2. Sélectionnez **Application permissions**
3. Ajoutez `Mail.Send`
4. Cliquez sur **Grant admin consent**

#### 4. Activer SMTP AUTH dans Office 365

```powershell
# Connexion à Exchange Online
Connect-ExchangeOnline

# Activer SMTP AUTH pour l'utilisateur
Set-CASMailbox -Identity "expediteur@votredomaine.com" -SmtpClientAuthenticationDisabled $false
```

---

## 📚 Documentation

### Structure du projet

```
smtp-relay-o365/
├── src/
│   ├── index.ts                 # Point d'entrée principal
│   ├── database/
│   │   ├── db.ts               # Connexion SQLite
│   │   ├── schema.ts           # Schéma de base de données
│   │   └── config.ts           # Gestion configuration
│   ├── auth/
│   │   └── azure.ts            # Authentification Azure AD
│   ├── smtp/
│   │   ├── server.ts           # Serveur SMTP
│   │   └── o365Client.ts       # Client Office 365
│   └── web/
│       └── app.ts              # API Express
├── public/
│   ├── index.html              # Interface web
│   ├── styles.css              # Styles
│   └── app.js                  # JavaScript frontend
├── data/
│   └── relay.db                # Base de données SQLite
├── documentations/
│   ├── technicals.md           # Cahier des charges
│   └── SUIVI.md                # Suivi d'avancement
├── .env                        # Configuration (à créer)
├── .env.example                # Template de configuration
├── package.json
├── tsconfig.json
└── README.md
```

### API REST

#### Statut et configuration

```bash
# Obtenir le statut du serveur
GET /api/status

# Lire la configuration (secrets masqués)
GET /api/config

# Mettre à jour la configuration
PUT /api/config
Content-Type: application/json
{
  "AZURE_TENANT_ID": "xxx",
  "AZURE_CLIENT_ID": "yyy",
  "AZURE_CLIENT_SECRET": "zzz",
  "O365_USER_EMAIL": "sender@domain.com"
}

# Tester la connexion Azure AD
POST /api/config/test
```

#### Gestion des emails

```bash
# Lister les emails (avec filtres)
GET /api/emails?status=failed&from=app@domain.com&q=facture&limit=20&offset=0

# Détail d'un email
GET /api/emails/:id

# Envoyer un email vers Office 365
POST /api/emails/:id/send

# Retenter un envoi échoué
POST /api/emails/:id/retry
```

#### Logs

```bash
# Obtenir les logs système
GET /api/logs/system?level=error&limit=100
```

### Exemples d'utilisation

#### Envoyer un email via le relay

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Créer l'email
msg = MIMEMultipart()
msg['From'] = 'app@domain.com'
msg['To'] = 'destinataire@exemple.com'
msg['Subject'] = 'Test depuis SMTP Relay'

body = 'Ceci est un email de test envoyé via le relay SMTP.'
msg.attach(MIMEText(body, 'plain'))

# Envoyer via le relay (pas d'authentification)
with smtplib.SMTP('localhost', 2525) as server:
    server.send_message(msg)
    print("Email envoyé avec succès!")
```

#### Utiliser l'API avec curl

```bash
# Vérifier le statut
curl http://localhost:3000/api/status | jq

# Lister les derniers emails
curl "http://localhost:3000/api/emails?limit=10" | jq

# Envoyer un email en attente
curl -X POST http://localhost:3000/api/emails/123/send

# Tester la configuration Azure
curl -X POST http://localhost:3000/api/config/test
```

---

## 🗄️ Base de données

### Schéma SQLite

Le relay utilise SQLite pour la persistance avec les tables suivantes :

- **`config`** - Configuration de l'application
- **`emails`** - Tous les emails reçus et leur statut
- **`smtp_connections`** - Historique des connexions SMTP
- **`system_logs`** - Logs applicatifs structurés

Le schéma est initialisé automatiquement au premier démarrage.

### Accès direct à la base

```bash
# Ouvrir la base avec sqlite3
sqlite3 data/relay.db

# Exemples de requêtes
SELECT COUNT(*) FROM emails WHERE status = 'sent';
SELECT * FROM emails WHERE received_at > datetime('now', '-1 day');
SELECT level, COUNT(*) FROM system_logs GROUP BY level;
```

---

## 🧪 Tests

### Tester la réception SMTP

```bash
# Avec telnet
telnet localhost 2525
EHLO test
MAIL FROM:<test@example.com>
RCPT TO:<dest@example.com>
DATA
Subject: Test email
From: test@example.com
To: dest@example.com

Ceci est un test.
.
QUIT

# Avec swaks (recommandé)
swaks --to dest@example.com \
      --from test@example.com \
      --server localhost:2525 \
      --body "Email de test"
```

### Tester l'API

```bash
# Vérifier que tout fonctionne
npm run test

# Tests d'intégration
npm run test:integration
```

---

## 🔧 Développement

### Scripts disponibles

```bash
npm run build       # Compiler TypeScript → JavaScript
npm start           # Démarrer en production
npm run dev         # Mode développement (watch)
npm run test        # Lancer les tests
npm run lint        # Vérifier le code
npm run clean       # Nettoyer les builds
```

### Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 🐛 Dépannage

### Le serveur SMTP ne démarre pas

```bash
# Vérifier que le port n'est pas déjà utilisé
netstat -an | grep 2525

# Changer le port dans .env
SMTP_PORT=2526
```

### Erreur d'authentification Azure AD

1. Vérifier que les identifiants sont corrects dans `.env`
2. Tester avec l'endpoint de test : `POST /api/config/test`
3. Vérifier les permissions dans Azure AD
4. S'assurer que le consent administrateur est accordé

### Les emails ne sont pas envoyés vers Office 365

1. Vérifier que SMTP AUTH est activé dans O365
2. Vérifier les logs : `GET /api/logs/system?level=error`
3. Tester manuellement : `POST /api/emails/:id/send`
4. Vérifier la configuration réseau (firewall, proxy)

### La base de données est corrompue

```bash
# Sauvegarder l'ancienne base
mv data/relay.db data/relay.db.backup

# Redémarrer l'application (nouvelle base créée)
npm start

# Récupérer les données si nécessaire
sqlite3 data/relay.db.backup ".dump emails" | sqlite3 data/relay.db
```

---

## 📊 Monitoring

### Métriques disponibles

- Nombre d'emails reçus/envoyés/échoués
- Taux de succès
- Latence d'envoi
- Connexions SMTP actives
- Erreurs par type

### Logs

Les logs sont disponibles via :
- Interface web : section "Logs"
- API : `GET /api/logs/system`
- Base de données : table `system_logs`

---

## 🔒 Sécurité

### Bonnes pratiques

- ✅ Jamais de secrets en clair dans le code
- ✅ Utilisation de variables d'environnement
- ✅ Connexions TLS vers Office 365
- ✅ Validation des certificats SSL
- ✅ Logs sans informations sensibles
- ✅ Interface web accessible uniquement en local par défaut

### Recommandations production

1. Activer l'authentification sur l'interface web
2. Utiliser un reverse proxy (nginx, Traefik)
3. Configurer un firewall (whitelist IP)
4. Mettre en place des sauvegardes automatiques
5. Monitorer les logs d'erreur
6. Définir des alertes

---

## 📄 Licence

Ce projet est privé et destiné à un usage interne uniquement.

---

## 🤝 Support

Pour toute question ou problème :

1. Consulter la [documentation technique](documentations/technicals.md)
2. Vérifier les [issues existantes](../../issues)
3. Créer une nouvelle issue si nécessaire
4. Consulter le [suivi d'avancement](documentations/SUIVI.md)

---

## 📈 Statistiques

<div align="center">

![Lines of Code](https://img.shields.io/badge/lines%20of%20code-2.5k-blue)
![Coverage](https://img.shields.io/badge/coverage-75%25-yellow)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

**Développé avec ❤️ en TypeScript**

</div>