SUIVI des fonctionnalités – SMTP Relay Office 365

Mise à jour: 2025-11-19 16:03

Objectif
- Suivre l’avancement des fonctionnalités livrées et restantes, basé sur le cahier des charges (voir documentations/technicals.md).

Légende des statuts
- [x] Fait
- [~] Partiel (fonction de base OK, reste à compléter)
- [ ] À faire

1) Synthèse
- Réception SMTP (sans authentification), parsing et persistance SQLite: [x]
- API HTTP minimale (status, emails, logs): [x]
- Envoi vers Office 365 avec OAuth2: [~] (envoi manuel via API opérationnel; pièces jointes et file d’attente à venir)
- Interface Web (UI) et temps réel: [~] (UI enrichie: filtres/pagination, détail, auto‑refresh; WebSocket à venir)

2) Détail par exigences fonctionnelles (FR)
- FR-01 Port SMTP configurable (2525 par défaut): [x]
- FR-02 Connexions sans authentification SMTP: [x]
- FR-03 Commandes SMTP standard (EHLO, MAIL, RCPT, DATA, QUIT): [x]
- FR-04 Parsing des emails entrants: [x]
- FR-05 Champs email (From, To, CC, BCC, Subject): [x]
- FR-06 Contenu texte et HTML: [x]
- FR-07 Pièces jointes (tout type): [~] (métadonnées stockées, contenu non archivé)
- FR-08 Encodage préservé: [~] (mailparser OK, tests étendus à ajouter)
- FR-09 Stockage en SQLite: [x]
- FR-10 OAuth2 (Client Credentials) – obtention token: [x]
- FR-11 Renouvellement automatique du token: [x]
- FR-12 Retry erreurs d’authentification: [x]
- FR-13 Logs d’authentification: [~] (succès/échecs test journalisés)
- FR-14 Connexion smtp.office365.com:587: [x]
- FR-15 STARTTLS: [x]
- FR-16 Authentification via token OAuth2: [x]
- FR-17 Transmission complète de l’email: [~] (contenu texte/HTML; pièces jointes non envoyées)
- FR-18 Mise à jour du statut d’envoi: [x]
- FR-19 Stockage configuration (port, Azure AD, O365): [x]
- FR-20 Persistance de tous les emails reçus: [x]
- FR-21 Logs des connexions entrantes: [x]
- FR-22 Historisation événements et erreurs: [~] (logs système basiques)
- FR-23 Métriques quotidiennes: [~] (table prête, alimentation à faire)
- FR-24 Dashboard temps réel: [~] (dashboard sans WebSocket)
- FR-25/26 Page de configuration (affichage/édition): [~] (lecture/écriture + test OAuth2)
- FR-27 Test de connexion Azure AD et O365: [~] (test token Azure OK)
- FR-28 Redémarrer le serveur SMTP: [x]
- FR-29 Liste paginée emails reçus: [x]
- FR-30/31 Filtres et recherche: [x]
- FR-32 Colonnes affichées (liste): [x] (date, from, to, sujet, statut, taille)
- FR-33 Détail d’un email: [x] (modal + envoi/retry)
- FR-34..FR-37 Logs d’envoi + retry: [ ]
- FR-38 Logs système temps réel: [x] (vue UI + auto-refresh 5s)
- FR-39..FR-42 Filtres/recherche/auto-refresh/export: [ ]
- FR-43..FR-47 Design UI: [~] (thème + ergonomie améliorés)

3) Exigences non-fonctionnelles (NFR)
- NFR-01 Latence < 2s: [ ] (à mesurer)
- NFR-02 100 emails/min: [ ] (tests de charge)
- NFR-03 PJ jusqu’à 25 MB: [ ]
- NFR-04 Mémoire < 500 MB: [ ]
- NFR-05 UI réactive < 500ms: [ ]
- NFR-06 DB < 1 GB pour 10k emails: [ ]
- NFR-07 Disponibilité 99.5%: [ ]
- NFR-08 Aucune perte d’email: [~] (réception OK; pipeline d’envoi à implémenter)
- NFR-09 Redémarrage auto en cas de crash: [ ]
- NFR-10 Arrêt gracieux (SIGTERM): [ ]
- NFR-11 Intégrité transactionnelle: [~] (SQLite + WAL)
- NFR-12 Secrets via variables d’environnement: [x]
- NFR-13 Pas de secrets en clair dans logs/UI: [~]
- NFR-14 TLS vers O365: [ ]
- NFR-15 Validation certificats SSL: [ ]
- NFR-16 Interface web locale par défaut: [~]
- NFR-17 Permissions restrictives SQLite: [ ]
- NFR-18 Code modulaire et testé: [~] (tests à écrire)
- NFR-19 Documentation complète: [~] (README, technicals, suivi)
- NFR-20 Configuration par env: [x]
- NFR-21 Logs exploitables: [~]
- NFR-22 Schéma versionné (migrations): [~] (user_version=1)
- NFR-23 Node 18+: [x]
- NFR-24 Docker: [ ]
- NFR-25 Linux/Windows/macOS: [~]
- NFR-26 Pas de dépendances natives (hors SQLite): [x]
- NFR-27 Design cohérent: [~] (thème sombre minimal)
- NFR-28 SPA (sans rechargement): [~] (hash-routing sans framework)
- NFR-29 Messages d’erreur clairs: [ ]
- NFR-30 Feedback visuel: [ ]

4) Prochaines étapes (roadmap courte)
- Finaliser envoi SMTP O365 (FR-14 → FR-18)
- Étendre l’API: configuration, stats, retry, export
- WebSocket temps réel + UI minimale (dashboard + listes)
- Stratégies de retry et alimentation des métriques quotidiennes
- Tests unitaires/intégration; préparation Docker/CI

5) Journal des versions
- 2025-11-14 20:17: Ajout envoi O365 (OAuth2) via endpoint API (/api/emails/:id/send, /retry), filtres sur /api/emails, mises à jour README; logs d’envoi et statuts en base.
- 2025-11-14 20:24: Ajout interface Web (SPA) minimale: Dashboard, Emails (liste + détail + envoi), Configuration (lecture/édition + test OAuth2), Logs système (filtre + auto-refresh). Service statique via Express; README mis à jour.
 - 2025-11-14 20:54: Ajout cache/renouvellement automatique du token Azure (FR-11), retry ciblé sur erreurs d’auth à l’envoi O365 (FR-12), endpoint API de redémarrage SMTP (/api/smtp/restart) et statut temps réel (FR-28). Mises à jour dist pour démarrer sans rebuild.
 - 2025-11-14 21:03: Amélioration UI (barre d’état SMTP + redémarrage, liste emails avec filtres/pagination/colonnes étendues, modal détail avec action d’envoi, logs avec auto-refresh). FR‑29/30/31/32/33 passés à [x], FR‑38 à [x], FR‑43..47 à [~].
 - 2025-11-19 16:03: **Intégration frontend Next.js moderne** : Ajout d'un frontend Next.js 16 + React 19 avec shadcn/ui, Tailwind CSS et Recharts dans le dossier /frontend. Création d'un client API TypeScript complet (lib/api.ts) avec interfaces typées pour tous les endpoints. Configuration du proxy API via next.config.mjs. Mise à jour architecture avec séparation frontend (port 3001) / backend (port 3000). Ajout scripts npm (dev, build:frontend, install:frontend) avec concurrently pour développement simultané. Documentation complète : README mis à jour avec nouvelle architecture, création de INTEGRATION.md avec guide détaillé d'intégration, exemples d'utilisation, bonnes pratiques et options de déploiement. NFR-27 Design cohérent amélioré avec UI moderne professionnelle.
