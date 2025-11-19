# Cahier des Charges - SMTP Relay Office 365 avec Azure AD

## 1. Contexte et Objectifs

### 1.1 Contexte
L'organisation utilise Office 365 avec Azure AD pour la gestion des emails. Une application legacy ne supporte que le protocole SMTP standard sans authentification OAuth2, ce qui l'empêche de communiquer directement avec Office 365.

### 1.2 Objectif Principal
Développer un serveur relay SMTP en Node.js avec interface web de monitoring qui fait le pont entre l'application legacy (SMTP standard) et Office 365 (OAuth2 via Azure AD).

### 1.3 Objectifs Spécifiques
- Accepter les connexions SMTP standard sans authentification
- Gérer l'authentification OAuth2 avec Azure AD de manière transparente
- Transmettre les emails reçus vers Office 365
- Fournir une interface web de monitoring et configuration
- Persister tous les logs et emails dans SQLite
- Assurer la fiabilité et la traçabilité des envois

## 2. Périmètre Fonctionnel

### 2.1 Fonctionnalités Requises

#### 2.1.1 Réception SMTP
- **FR-01** : Écouter sur un port SMTP configurable (par défaut 2525)
- **FR-02** : Accepter les connexions sans authentification SMTP
- **FR-03** : Supporter les commandes SMTP standard : EHLO, MAIL FROM, RCPT TO, DATA, QUIT
- **FR-04** : Parser les emails entrants avec leurs métadonnées complètes

#### 2.1.2 Gestion des Emails
- **FR-05** : Extraire et préserver tous les champs de l'email (From, To, CC, BCC, Subject)
- **FR-06** : Supporter le contenu texte et HTML
- **FR-07** : Gérer les pièces jointes de tout type
- **FR-08** : Préserver l'encodage des caractères spéciaux
- **FR-09** : Stocker chaque email en base de données SQLite

#### 2.1.3 Authentification Azure AD
- **FR-10** : Obtenir un token OAuth2 via Client Credentials Flow
- **FR-11** : Gérer le renouvellement automatique des tokens
- **FR-12** : Gérer les erreurs d'authentification avec retry
- **FR-13** : Logger les tentatives d'authentification en base

#### 2.1.4 Envoi vers Office 365
- **FR-14** : Se connecter à smtp.office365.com sur le port 587
- **FR-15** : Utiliser STARTTLS pour la sécurité
- **FR-16** : Authentifier avec le token OAuth2
- **FR-17** : Transmettre l'email avec toutes ses propriétés
- **FR-18** : Mettre à jour le statut d'envoi en base

#### 2.1.5 Base de Données SQLite
- **FR-19** : Stocker la configuration (port, Azure AD, O365)
- **FR-20** : Persister tous les emails reçus
- **FR-21** : Logger toutes les connexions entrantes
- **FR-22** : Historiser les événements et erreurs
- **FR-23** : Conserver les métriques (nb emails, taux de succès)

#### 2.1.6 Interface Web de Monitoring

##### Dashboard Principal
- **FR-24** : Vue d'ensemble en temps réel :
    - Statut du serveur SMTP (running/stopped)
    - Nombre d'emails en attente/envoyés/échoués (aujourd'hui)
    - Dernière activité
    - Graphique des emails des 7 derniers jours

##### Page de Configuration
- **FR-25** : Affichage de la configuration actuelle :
    - Port SMTP d'écoute
    - Tenant Azure AD (masqué partiellement)
    - Client ID (masqué partiellement)
    - Email Office 365 utilisé
    - Statut de la connexion Azure AD
- **FR-26** : Édition de la configuration (avec confirmation)
- **FR-27** : Test de connexion Azure AD et Office 365
- **FR-28** : Bouton "Redémarrer le serveur SMTP"

##### Page des Logs de Réception
- **FR-29** : Liste paginée des emails reçus (50 par page)
- **FR-30** : Filtres : date, expéditeur, destinataire, statut
- **FR-31** : Recherche full-text dans sujet et contenu
- **FR-32** : Colonnes affichées :
    - Date/heure de réception
    - Expéditeur
    - Destinataire(s)
    - Sujet
    - Taille
    - Statut (reçu/en cours/envoyé/échoué)
- **FR-33** : Détail d'un email au clic :
    - Tous les headers
    - Contenu texte et HTML
    - Liste des pièces jointes
    - Timeline des événements (reçu → envoi → confirmation)

##### Page des Logs d'Envoi
- **FR-34** : Liste des tentatives d'envoi vers Office 365
- **FR-35** : Filtres : date, statut (succès/échec), destinataire
- **FR-36** : Colonnes :
    - Date/heure d'envoi
    - Email ID (lien vers détail)
    - Destinataire
    - Statut
    - Message ID Office 365 (si succès)
    - Erreur (si échec)
- **FR-37** : Possibilité de réessayer un envoi échoué

##### Page des Logs Système
- **FR-38** : Logs applicatifs en temps réel
- **FR-39** : Filtres : niveau (info/warn/error), date, composant
- **FR-40** : Recherche dans les logs
- **FR-41** : Auto-refresh toutes les 5 secondes (optionnel)
- **FR-42** : Export des logs (CSV ou JSON)

##### Design de l'Interface
- **FR-43** : Design minimaliste et moderne
- **FR-44** : Responsive (desktop prioritaire)
- **FR-45** : Navigation claire (menu latéral ou header)
- **FR-46** : Thème clair/sombre (optionnel)
- **FR-47** : Pas d'authentification requise (sécurité par réseau)

### 2.2 Fonctionnalités Optionnelles (Phase 2)

#### 2.2.1 Sécurité Avancée
- **FO-01** : Whitelist d'adresses IP autorisées
- **FO-02** : Rate limiting par IP source
- **FO-03** : Validation des domaines expéditeurs
- **FO-04** : Support TLS pour les connexions entrantes
- **FO-05** : Authentification sur l'interface web

#### 2.2.2 Résilience
- **FO-06** : File d'attente avec retry automatique en cas d'échec
- **FO-07** : Notification par email en cas d'échec récurrent
- **FO-08** : Dead Letter Queue pour les emails non-livrables
- **FO-09** : Archivage automatique des vieux logs (> 90 jours)

#### 2.2.3 Monitoring Avancé
- **FO-10** : Métriques détaillées par heure/jour/semaine
- **FO-11** : Alertes configurables (seuils d'erreur)
- **FO-12** : Export des rapports en PDF
- **FO-13** : API REST pour intégration externe

#### 2.2.4 Interface Web Avancée
- **FO-14** : Recherche avancée avec opérateurs booléens
- **FO-15** : Sauvegarde/restauration de la configuration
- **FO-16** : Mode maintenance (pause des réceptions)
- **FO-17** : Visualisation des pièces jointes
- **FO-18** : Notifications push navigateur

## 3. Exigences Non-Fonctionnelles

### 3.1 Performance
- **NFR-01** : Latence < 2 secondes pour un email sans pièce jointe
- **NFR-02** : Support de 100 emails/minute minimum
- **NFR-03** : Gestion des pièces jointes jusqu'à 25 MB
- **NFR-04** : Utilisation mémoire < 500 MB en charge normale
- **NFR-05** : Interface web réactive < 500ms pour l'affichage
- **NFR-06** : Base SQLite < 1 GB pour 10,000 emails

### 3.2 Fiabilité
- **NFR-07** : Disponibilité 99.5% minimum
- **NFR-08** : Aucune perte d'email (persistance immédiate en DB)
- **NFR-09** : Redémarrage automatique en cas de crash
- **NFR-10** : Gestion gracieuse de l'arrêt (SIGTERM)
- **NFR-11** : Intégrité transactionnelle des données SQLite

### 3.3 Sécurité
- **NFR-12** : Secrets stockés dans variables d'environnement
- **NFR-13** : Jamais de secrets en clair dans les logs ou l'interface
- **NFR-14** : Connexion Office 365 chiffrée (TLS)
- **NFR-15** : Validation des certificats SSL
- **NFR-16** : Interface web accessible uniquement en local par défaut
- **NFR-17** : Base SQLite avec permissions restrictives

### 3.4 Maintenabilité
- **NFR-18** : Code modulaire et testé
- **NFR-19** : Documentation complète (README + JSDoc)
- **NFR-20** : Configuration par variables d'environnement
- **NFR-21** : Logs exploitables pour le debugging
- **NFR-22** : Schéma de base de données versionné (migrations)

### 3.5 Portabilité
- **NFR-23** : Compatible Node.js 18+
- **NFR-24** : Déployable en Docker
- **NFR-25** : Compatible Linux, Windows, macOS
- **NFR-26** : Pas de dépendances système natives (sauf SQLite)

### 3.6 Ergonomie Interface Web
- **NFR-27** : Design cohérent et professionnel
- **NFR-28** : Pas de rechargement de page (SPA)
- **NFR-29** : Messages d'erreur clairs et actionnables
- **NFR-30** : Feedback visuel pour toutes les actions

## 4. Architecture Technique

### 4.1 Stack Technologique

#### Backend
- **Runtime** : Node.js 18 LTS minimum
- **Serveur SMTP** : smtp-server (npm)
- **Client SMTP** : nodemailer (npm)
- **OAuth2** : @azure/msal-node (npm)
- **Parsing** : mailparser (npm)
- **Base de données** : better-sqlite3 (npm)
- **Serveur Web** : Express.js (npm)
- **WebSocket** : socket.io (npm) - pour temps réel

#### Frontend
- **Framework** : React ou Vue.js (léger)
- **UI Components** : Tailwind CSS ou Bootstrap minimal
- **Charts** : Chart.js ou Recharts
- **HTTP Client** : Axios ou Fetch API
- **Build** : Vite ou simple bundler

### 4.2 Structure du Projet
```
smtp-relay-o365/
├── server.js              # Point d'entrée principal
├── package.json           # Dépendances
├── .env.example           # Template de configuration
├── .env                   # Configuration (git-ignored)
├── README.md              # Documentation
├── data/
│   └── relay.db           # Base SQLite (git-ignored)
├── src/
│   ├── auth/
│   │   └── azureAuth.js   # Gestion OAuth2
│   ├── smtp/
│   │   ├── server.js      # Serveur SMTP
│   │   └── client.js      # Client Office 365
│   ├── parser/
│   │   └── mailParser.js  # Parsing des emails
│   ├── database/
│   │   ├── db.js          # Connexion SQLite
│   │   ├── schema.js      # Définition des tables
│   │   ├── migrations/    # Scripts de migration
│   │   └── queries.js     # Requêtes préparées
│   ├── web/
│   │   ├── app.js         # Serveur Express
│   │   ├── routes/        # Routes API
│   │   │   ├── config.js
│   │   │   ├── emails.js
│   │   │   ├── logs.js
│   │   │   └── stats.js
│   │   └── websocket.js   # Events temps réel
│   ├── logger/
│   │   └── logger.js      # Système de logging
│   └── config/
│       └── config.js      # Gestion de la config
├── public/                # Frontend (build)
│   ├── index.html
│   ├── assets/
│   └── ...
├── frontend/              # Sources frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Configuration.jsx
│   │   │   ├── EmailList.jsx
│   │   │   ├── EmailDetail.jsx
│   │   │   ├── SendLogs.jsx
│   │   │   └── SystemLogs.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── tests/
│   ├── unit/
│   └── integration/
└── Dockerfile             # Conteneurisation
```

### 4.3 Schéma de Base de Données SQLite

```sql
-- Configuration
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Emails reçus
CREATE TABLE emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT UNIQUE,
  from_address TEXT NOT NULL,
  to_addresses TEXT NOT NULL, -- JSON array
  cc_addresses TEXT,           -- JSON array
  bcc_addresses TEXT,          -- JSON array
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments TEXT,            -- JSON array
  headers TEXT,                -- JSON object
  size_bytes INTEGER,
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'received', -- received/sending/sent/failed
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  sent_at DATETIME,
  o365_message_id TEXT
);

CREATE INDEX idx_emails_received_at ON emails(received_at);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_from ON emails(from_address);

-- Logs de connexions SMTP
CREATE TABLE smtp_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  remote_ip TEXT NOT NULL,
  connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  disconnected_at DATETIME,
  emails_received INTEGER DEFAULT 0
);

CREATE INDEX idx_smtp_connections_date ON smtp_connections(connected_at);

-- Logs système
CREATE TABLE system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,        -- info/warn/error
  component TEXT NOT NULL,    -- smtp/oauth/web/etc
  message TEXT NOT NULL,
  details TEXT,               -- JSON pour contexte
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_date ON system_logs(created_at);
CREATE INDEX idx_system_logs_level ON system_logs(level);

-- Métriques quotidiennes
CREATE TABLE daily_metrics (
  date DATE PRIMARY KEY,
  emails_received INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  total_size_bytes INTEGER DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0
);
```

### 4.4 Flux de Données

```
Application Legacy
      ↓ SMTP (port 2525, no auth)
Serveur Relay (Node.js)
      ↓ Parse email + Save to SQLite
      ↓ WebSocket notification → Interface Web
Azure AD OAuth2
      ↓ Get token
Office 365 SMTP
      ↓ SMTP + OAuth2 (port 587, TLS)
      ↓ Update status in SQLite
Destinataire final
      ↓ Notification temps réel
Interface Web (refresh)
```

### 4.5 API REST pour l'Interface Web

```
GET  /api/status              # Statut du serveur
GET  /api/stats               # Statistiques globales
GET  /api/config              # Configuration actuelle
PUT  /api/config              # Mise à jour config
POST /api/config/test         # Test connexion Azure/O365

GET  /api/emails              # Liste emails (pagination + filtres)
GET  /api/emails/:id          # Détail d'un email
POST /api/emails/:id/retry    # Réessayer envoi

GET  /api/logs/send           # Logs d'envoi
GET  /api/logs/system         # Logs système
GET  /api/logs/export         # Export logs (CSV/JSON)

GET  /api/metrics/daily       # Métriques par jour
GET  /api/metrics/hourly      # Métriques par heure

WebSocket /ws                 # Events temps réel
  - email.received
  - email.sent
  - email.failed
  - server.status
```

## 5. Configuration Requise

### 5.1 Azure AD
- Tenant ID
- Application (Client) ID
- Client Secret
- Permission API : Mail.Send (Application)
- Admin consent accordé

### 5.2 Office 365
- Compte utilisateur actif
- SMTP AUTH activé pour le compte
- Licence Exchange Online

### 5.3 Variables d'Environnement
```env
# Serveur SMTP
SMTP_PORT=2525

# Serveur Web
WEB_PORT=3000
WEB_HOST=localhost

# Azure AD
AZURE_TENANT_ID=xxx
AZURE_CLIENT_ID=xxx
AZURE_CLIENT_SECRET=xxx

# Office 365
O365_USER_EMAIL=expediteur@domain.com

# Base de données
DB_PATH=./data/relay.db

# Logs
LOG_LEVEL=info
LOG_RETENTION_DAYS=90
```

## 6. Interface Utilisateur - Maquettes Fonctionnelles

### 6.1 Dashboard (Page d'accueil)

```
┌─────────────────────────────────────────────────────────┐
│  SMTP Relay Monitor              [Config] [Logs] [Aide] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 STATISTIQUES DU JOUR                                │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ 🟢 Reçus     │ 📤 Envoyés   │ ❌ Échecs    │        │
│  │     42       │     40       │      2       │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                          │
│  📈 EMAILS - 7 DERNIERS JOURS                           │
│  ┌────────────────────────────────────────────┐        │
│  │        [Graphique en barres]               │        │
│  │  50│     ▄                                  │        │
│  │  40│   ▄ █ ▄                                │        │
│  │  30│ ▄ █ █ █ ▄ ▄ ▄                          │        │
│  │    └─────────────────────                  │        │
│  │     L  M  M  J  V  S  D                    │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  ⚙️  STATUT DU SERVEUR                                  │
│  • Serveur SMTP : 🟢 En cours (port 2525)              │
│  • Azure AD     : 🟢 Connecté                          │
│  • Dernière activité : Il y a 2 minutes                │
│                                                          │
│  📧 DERNIERS EMAILS                                     │
│  ┌────────────────────────────────────────────────┐   │
│  │ 14:32  app@domain.com → client@ext.com  ✅     │   │
│  │        Facture #12345                          │   │
│  ├────────────────────────────────────────────────┤   │
│  │ 14:28  app@domain.com → user@test.com   ✅     │   │
│  │        Confirmation commande                   │   │
│  ├────────────────────────────────────────────────┤   │
│  │ 14:15  app@domain.com → admin@test.com  ❌     │   │
│  │        Rapport quotidien                       │   │
│  └────────────────────────────────────────────────┘   │
│                                  [Voir tous les emails] │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Page Configuration

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️  CONFIGURATION                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🌐 SERVEUR SMTP                                        │
│  ┌──────────────────────────────────────────┐          │
│  │ Port d'écoute     [2525        ]         │          │
│  │ Statut           🟢 En cours d'exécution │          │
│  │ [Redémarrer le serveur]                  │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│  🔐 AZURE ACTIVE DIRECTORY                              │
│  ┌──────────────────────────────────────────┐          │
│  │ Tenant ID        abc123•••••••••         │          │
│  │ Client ID        def456•••••••••         │          │
│  │ Client Secret    ••••••••••••••          │          │
│  │ Statut           🟢 Token valide         │          │
│  │ Expire dans      45 minutes              │          │
│  │ [Tester la connexion]                    │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│  📧 OFFICE 365                                          │
│  ┌──────────────────────────────────────────┐          │
│  │ Email utilisé    sender@domain.com       │          │
│  │ Serveur SMTP     smtp.office365.com:587  │          │
│  │ Statut           🟢 Opérationnel         │          │
│  │ [Envoyer un email de test]               │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│  💾 BASE DE DONNÉES                                     │
│  ┌──────────────────────────────────────────┐          │
│  │ Fichier          relay.db                │          │
│  │ Taille           45.2 MB                 │          │
│  │ Emails stockés   1,234                   │          │
│  │ [Optimiser] [Archiver anciens logs]      │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│                      [Enregistrer les modifications]     │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Page Emails Reçus

```
┌─────────────────────────────────────────────────────────┐
│  📥 EMAILS REÇUS                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔍 [Rechercher sujet, expéditeur...]                   │
│  📅 [Aujourd'hui ▾] 👤 [Tous ▾] 📊 [Tous statuts ▾]    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Date/Heure  │ De              │ À          │ Statut │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 14:32:15    │ app@domain.com  │ client@... │ ✅ Envoyé│ │
│  │ Facture #12345                 │ 145 KB     │      │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 14:28:03    │ app@domain.com  │ user@...   │ ✅ Envoyé│ │
│  │ Confirmation commande          │ 12 KB      │      │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ 14:15:42    │ app@domain.com  │ admin@...  │ ❌ Échec│ │
│  │ Rapport quotidien              │ 2.3 MB     │      │ │
│  │ Erreur: 550 Mailbox unavailable           │ [Réessayer]│
│  ├────────────────────────────────────────────────────┤ │
│  │ 13:45:21    │ app@domain.com  │ test@...   │ ✅ Envoyé│ │
│  │ Alerte système                 │ 8 KB       │      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [< Précédent]  Page 1 sur 25  [Suivant >]             │
│                                                          │
│  Clic sur une ligne pour voir les détails complets     │
└─────────────────────────────────────────────────────────┘
```

### 6.4 Détail d'un Email (Modal ou page)

```
┌─────────────────────────────────────────────────────────┐
│  📧 DÉTAIL DE L'EMAIL #1234                    [Fermer] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ℹ️ INFORMATIONS GÉNÉRALES                              │
│  • Reçu le       : 14/11/2025 à 14:32:15               │
│  • De            : app@domain.com                       │
│  • À             : client@externe.com                   │
│  • Sujet         : Facture #12345                       │
│  • Taille        : 145 KB                               │
│  • Pièces jointes: facture_12345.pdf (140 KB)          │
│                                                          │
│  📊 STATUT D'ENVOI                                      │
│  ┌──────────────────────────────────────────┐          │
│  │ 14:32:15  ✓ Email reçu                   │          │
│  │ 14:32:16  ✓ Authentification Azure AD    │          │
│  │ 14:32:17  ✓ Connexion Office 365         │          │
│  │ 14:32:18  ✓ Email envoyé                 │          │
│  │ Message ID: <abc123@outlook.office365.com>          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│  📄 CONTENU                                             │
│  ┌──────────────────────────────────────────┐          │
│  │ Bonjour,                                  │          │
│  │                                            │          │
│  │ Veuillez trouver ci-joint la facture     │          │
│  │ #12345 pour un montant de 1,234.56 €.    │          │
│  │                                            │          │
│  │ Cordialement,                             │          │
│  │ L'équipe                                  │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
│  🔧 HEADERS SMTP (cliquer pour déplier)                │
│                                                          │
│  [Télécharger l'email complet (.eml)]                  │
└─────────────────────────────────────────────────────────┘
```

## 7. Tests et Validation

### 7.1 Tests Unitaires
- Parsing d'emails
- Gestion des tokens OAuth2
- Validation des configurations
- Requêtes SQL
- Routes API

### 7.2 Tests d'Intégration
- Connexion SMTP entrante
- Authentification Azure AD
- Envoi via Office 365
- Persistance SQLite
- WebSocket temps réel
- Interface web complète

### 7.3 Tests de Charge
- 100 emails/minute
- Emails avec pièces jointes 10 MB
- Connexions simultanées
- Performance interface web (1000+ emails en DB)

### 7.4 Critères d'Acceptation
- ✅ Email simple envoyé en < 2s
- ✅ Email avec PJ 5MB envoyé en < 10s
- ✅ 100 emails consécutifs sans erreur
- ✅ Tous les emails persistés en base
- ✅ Interface web chargement < 500ms
- ✅ Recherche dans 10,000 emails < 1s
- ✅ WebSocket notifications instantanées
- ✅ Redémarrage gracieux sans perte
- ✅ Configuration éditable via interface
- ✅ Logs exploitables et filtrables

## 8. Sécurité

### 8.1 Menaces Identifiées
- **M-01** : Utilisation comme relay ouvert (spam)
- **