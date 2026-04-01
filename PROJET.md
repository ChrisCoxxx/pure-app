# PURE App — État du projet

*Dernière mise à jour : 1 avril 2026*

---

## URLs importantes

| Service | URL |
|---|---|
| App en ligne | https://pure-app-alpha.vercel.app |
| Login membre | https://pure-app-alpha.vercel.app/login |
| Inscription / paiement | https://pure-app-alpha.vercel.app/register |
| Interface admin | https://pure-app-alpha.vercel.app/admin |
| Créer mot de passe | https://pure-app-alpha.vercel.app/set-password |
| GitHub repo | https://github.com/ChrisCoxxx/pure-app |
| Supabase dashboard | https://supabase.com/dashboard/project/vbrnelqagrbujceirvoi |
| Vercel dashboard | https://vercel.com |
| Stripe dashboard | https://dashboard.stripe.com |
| Resend dashboard | https://resend.com |

---

## Stack technique

- **Frontend** : Next.js 14 (React, TypeScript)
- **Base de données + Auth** : Supabase (PostgreSQL)
- **Hébergement** : Vercel (plan Hobby — gratuit)
- **Paiements** : Stripe (live mode)
- **Emails transactionnels** : Resend (domaine pure-be.com vérifié)
- **Repo** : GitHub (ChrisCoxxx/pure-app)

---

## Comptes & accès

| Service | Compte |
|---|---|
| GitHub | ChrisCoxxx |
| Supabase | Organisation PURE |
| Vercel | chriscoxxx (Hobby) |
| Stripe | live mode actif |
| Resend | connecté via GitHub, domaine pure-be.com vérifié |
| Admin app | chris.cdr@gmail.com |

---

## Variables d'environnement (dans Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL` = https://pure-app-alpha.vercel.app

---

## Structure du code
```
pure-app/
├── app/
│   ├── page.tsx              → redirect login/dashboard
│   ├── layout.tsx            → layout global
│   ├── globals.css           → styles globaux
│   ├── login/page.tsx        → page connexion (FR/EN)
│   ├── dashboard/page.tsx    → dashboard membre
│   ├── batch/[number]/page.tsx → détail batch + PDF
│   ├── account/page.tsx      → compte membre
│   ├── set-password/page.tsx → création mot de passe (invit/reset)
│   ├── register/page.tsx     → page inscription + Stripe
│   ├── admin/page.tsx        → interface admin
│   └── api/
│       ├── stripe-webhook/route.ts → webhook paiement Stripe
│       ├── invite/route.ts         → API invitation membre
│       └── delete-member/route.ts  → API suppression membre
├── lib/
│   ├── supabase.ts           → client Supabase
│   ├── progression.ts        → logique batch/unlock
│   └── i18n.ts               → traductions FR/EN
├── package.json
├── tsconfig.json
└── next.config.js
```

---

## Base de données Supabase

### Table `profiles`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | = auth.users.id |
| email | text | email membre |
| first_name | text | prénom membre (nullable) |
| is_active | boolean | accès autorisé |
| start_date | date | début du programme |
| lang | text | 'fr' ou 'en' |
| created_at | timestamp | date création |

### Table `batches`
| Colonne | Type | Description |
|---|---|---|
| id | uuid | auto-généré |
| batch_number | int | 1 à 24 |
| title | text | nom du batch |
| description | text | description courte |
| pdf_url | text | lien Google Drive |
| is_published | boolean | visible ou non |
| created_at | timestamp | date création |

---

## Logique de progression
```
weeksElapsed = floor((today - start_date) / 7)
maxUnlockedBatch = min((weeksElapsed + 1) * 2, 24)
currentBatches = [maxUnlocked - 1, maxUnlocked]
archives = tous les batchs < currentBatches[0]
```

| Semaine | Batchs affichés | Archives |
|---|---|---|
| 1 (j0-6) | 1-2 | aucune |
| 2 (j7-13) | 3-4 | 1-2 |
| 3 (j14-20) | 5-6 | 1-4 |
| ... | ... | ... |
| 12 (j77+) | 23-24 | 1-22 |

---

## Fonctionnalités MVP — État

| Fonctionnalité | Statut |
|---|---|
| Login / logout | ✅ |
| Reset mot de passe | ✅ |
| Création mot de passe (invitation) | ✅ |
| Dashboard membre (FR/EN) | ✅ |
| Message de bienvenue avec prénom | ✅ |
| Barre de progression (semaine X) | ✅ |
| Progression automatique par batch | ✅ |
| Page détail batch + ouverture PDF | ✅ |
| Page compte membre | ✅ |
| Changement langue FR/EN | ✅ |
| Champ prénom (compte, set-password, admin) | ✅ |
| Interface admin (batchs + membres) | ✅ |
| Suppression membre depuis admin | ✅ |
| Invitation membre depuis admin | ✅ |
| Page inscription publique | ✅ |
| Paiement Stripe → activation auto | ✅ |
| Lien Admin dans nav (admin only) | ✅ |
| Protection URL (batch non unlocked) | ✅ |
| Emails via Resend (domaine pure-be.com) | ✅ |

---

## Emails — Configuration Resend

- **Domaine vérifié** : pure-be.com
- **Expéditeur** : hello@pure-be.com
- **SMTP configuré dans Supabase** : smtp.resend.com / port 465
- **Limite** : 3000 emails/mois (plan gratuit Resend)

---

## Flux membre

### Via paiement Stripe
1. Membre va sur `/register` → clique "S'abonner"
2. Paiement sur Stripe (buy.stripe.com/...)
3. Webhook Stripe → compte créé + activé + start_date = aujourd'hui
4. Email automatique via Resend → membre crée son mot de passe + saisit son prénom
5. Accès immédiat au dashboard ✅

### Via invitation admin
1. Admin va sur `/admin` → onglet Membres
2. Entre le prénom (optionnel) + email → "Envoyer l'invitation"
3. Membre reçoit email → crée mot de passe + saisit son prénom
4. Compte activé automatiquement (trigger Supabase) ✅

---

## Gestion admin quotidienne

| Action | Où |
|---|---|
| Inviter un membre | /admin → Membres → Inviter |
| Activer/désactiver un membre | /admin → Membres → Modifier |
| Changer start_date | /admin → Membres → Modifier |
| Modifier le prénom d'un membre | /admin → Membres → Modifier |
| Supprimer un membre | /admin → Membres → Supprimer |
| Ajouter/modifier un batch | /admin → Batchs |
| Rembourser un client | Stripe Dashboard |
| Annuler un abonnement | Stripe → puis is_active=false dans admin |

---

## Todo — Prochaines étapes

- [ ] Connecter un vrai domaine (ex: app.pure-be.com)
- [ ] Email automatique chaque semaine quand nouveaux batchs débloqués (cron job)
- [ ] Tester webhook Stripe avec Stripe test mode
- [ ] Ajouter les 24 batchs complets dans l'admin
- [ ] Annulation automatique Supabase quand abonnement Stripe annulé
- [ ] Email de bienvenue personnalisé après activation
- [ ] Portail Stripe pour que le membre gère son abonnement seul

---

## Comment reprendre le développement avec Claude

1. Ouvre une nouvelle conversation avec Claude
2. Colle le contenu de ce fichier PROJET.md
3. Dis "Voici l'état de mon projet PURE, je voudrais..."
4. Claude a tout le contexte pour continuer sans repartir de zéro

---

## Comment modifier le code

1. Modifie les fichiers dans `Documents → GitHub → pure-app`
2. GitHub Desktop → résumé → Commit → Push
3. Vercel redéploie automatiquement en ~1 minute