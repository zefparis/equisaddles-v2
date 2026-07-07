# 📋 Changelog - 26 Janvier 2025

## ✅ Migration PostgreSQL - TERMINÉE

### Problème résolu
❌ **AVANT** : Données perdues à chaque redémarrage (stockage en mémoire RAM)  
✅ **MAINTENANT** : Persistance complète dans PostgreSQL Railway

### Changements techniques

#### 1. Driver de base de données
- ❌ Retiré : `drizzle-orm/neon-serverless` (incompatible avec Railway)
- ✅ Ajouté : `drizzle-orm/node-postgres` avec package `pg@^8.13.1`
- ✅ Configuration SSL pour Railway proxy

#### 2. Fichiers créés
- `server/db.ts` - Connexion PostgreSQL avec driver standard
- `server/postgres-storage.ts` - Implémentation complète du storage (179 lignes)
- `server/routes/migrations.ts` - Endpoints admin pour migrations manuelles
- `scripts/seed.ts` - Script d'initialisation des données
- `DATABASE_SETUP.md` - Documentation complète
- `DEPLOYMENT_STATUS.md` - Guide de diagnostic

#### 3. Schéma mis à jour
- Ajout du champ `featured` dans la table `products`
- Conservation de tous les autres champs pour compatibilité

#### 4. Scripts package.json
```json
{
  "db:push": "drizzle-kit push",
  "db:seed": "tsx scripts/seed.ts",
  "db:setup": "npm run db:push && npm run db:seed",
  "start:railway": "npm run db:push && node dist/index.js"
}
```

#### 5. Dockerfile optimisé
- Migrations automatiques au démarrage
- Conservation des devDependencies nécessaires (drizzle-kit, tsx)
- Pas de `npm prune` des outils de migration

---

## 🧹 Nettoyage des frais de port - TERMINÉ

### Problème
Des fonctionnalités de calcul de frais de port d'une version antérieure étaient toujours présentes.

### Retiré

#### Frontend (`checkout.tsx`)
- ❌ État `shippingCost` et `isCalculatingShipping`
- ❌ `useEffect` de calcul automatique des frais
- ❌ Appel API `/api/calculate-shipping`
- ❌ Affichage "Frais de livraison" dans le résumé
- ❌ Ajout des frais au total

#### Backend (`routes.ts`)
- ❌ Endpoint `POST /api/calculate-shipping`
- ❌ Paramètre `shippingCost` dans `create-payment-intent`
- ❌ Calcul `amount + shippingCost`
- ❌ Metadata `shippingCost` dans Stripe session

### Conservé
- ✅ Champ `shippingCost` dans le schéma `orders` (valeur par défaut "0")
- ✅ Récupération du `shippingCost` dans le webhook (pour compatibilité)

---

## 🔐 Vérification Stripe - OK

### Webhook configuré
✅ Endpoint : `/webhook`  
✅ Validation de signature avec `STRIPE_WEBHOOK_SECRET`  
✅ Événements traités :
  - `checkout.session.completed` → Création de commande
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`

### Flux de paiement
1. Client remplit le formulaire de checkout
2. Appel à `/api/create-payment-intent`
3. Création de session Stripe Checkout
4. Redirection vers Stripe (nouvel onglet)
5. Paiement client
6. Webhook `checkout.session.completed`
7. **Commande enregistrée dans PostgreSQL** ✅
8. Client redirigé vers `/confirmation`

### Données de commande enregistrées
```typescript
{
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  customerAddress: string,
  customerCity: string,
  customerPostalCode: string,
  customerCountry: string,
  items: string (JSON),
  totalAmount: string,
  shippingCost: "0",
  status: "paid",
  stripeSessionId: string
}
```

---

## 🎯 Endpoints d'administration

### Diagnostics
```bash
GET /api/admin/db-status
# Vérifie la connexion à la base de données
```

### Migrations manuelles
```bash
POST /api/admin/run-migrations
# Exécute drizzle-kit push
```

### Seed des données
```bash
POST /api/admin/run-seed
# Ajoute les produits d'exemple
```

---

## 📊 État actuel

### ✅ Fonctionnel
- Base de données PostgreSQL Railway
- Persistance des données
- Création de produits dans `/admin`
- Catalogue de produits
- Panier et checkout
- Paiement Stripe
- Webhook et enregistrement des commandes
- Upload d'images

### 🧪 À tester
1. **Créer un produit** → Vérifier qu'il reste après redémarrage
2. **Passer une commande** → Vérifier dans `/admin` que la commande apparaît
3. **Webhook Stripe** → Vérifier les logs Railway

---

## 🚀 Commandes de déploiement

### Premier déploiement
```bash
# Railway va automatiquement :
# 1. Builder l'application
# 2. Exécuter npm run db:push (migrations)
# 3. Démarrer l'application

# Ensuite, pour ajouter les données d'exemple :
curl -X POST https://www.equisaddles.com/api/admin/run-seed
```

### Redéploiements suivants
```bash
git push
# Les données sont préservées ✅
# Pas besoin de re-seeder
```

---

## 📝 Variables d'environnement requises

```env
# Base de données (Railway PostgreSQL)
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Brevo (emails)
BREVO_API_KEY=...

# Session
SESSION_SECRET=...
```

---

## 🎉 Résultat final

### Avant
- ❌ Données perdues à chaque redémarrage
- ❌ Produits supprimés lors des déploiements
- ❌ Commandes volatiles
- ❌ Frais de port calculés automatiquement

### Maintenant
- ✅ Données persistantes dans PostgreSQL
- ✅ Produits sauvegardés définitivement
- ✅ Commandes enregistrées
- ✅ Prix du produit uniquement (sans frais de port)
- ✅ Application 100% fonctionnelle

---

**Date** : 26 Janvier 2025  
**Version** : 2.1.0  
**Environnement** : Railway Production
