# 🗄️ Configuration Base de Données PostgreSQL - Equi Saddles

## ✅ Problème résolu

**AVANT** : L'application utilisait `MemStorage` qui stockait toutes les données en mémoire (RAM).  
**Résultat** : ❌ Toutes les données étaient perdues à chaque redémarrage ou déploiement.

**MAINTENANT** : L'application utilise `PostgresStorage` avec Drizzle ORM.  
**Résultat** : ✅ Les données sont persistées dans PostgreSQL (Neon) et survivent aux redéploiements.

---

## 📋 Architecture de la base de données

### Tables principales

- **products** - Catalogue de selles et accessoires
- **product_images** - Images multiples par produit
- **gallery_images** - Galerie publique
- **orders** - Commandes clients avec détails Stripe
- **shipping_rates** - Tarifs de livraison DPD
- **chat_sessions** - Sessions de chat support
- **chat_messages** - Messages du chat

---

## 🚀 Déploiement initial (IMPORTANT)

### 1. Vérifier la configuration

Assurez-vous que `DATABASE_URL` est configurée dans vos variables d'environnement :

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### 2. Créer les tables

```bash
npm run db:push
```

Cette commande crée toutes les tables dans votre base de données PostgreSQL selon le schéma défini dans `shared/schema.ts`.

### 3. Initialiser les données

```bash
npm run db:seed
```

Cette commande ajoute des produits et images d'exemple pour démarrer.

### 4. Tout-en-un (recommandé pour premier déploiement)

```bash
npm run db:setup
```

Cette commande exécute `db:push` puis `db:seed` automatiquement.

---

## 📦 Fichiers créés

### Nouveaux fichiers

1. **`server/db.ts`** - Connexion PostgreSQL via Neon
2. **`server/postgres-storage.ts`** - Implémentation PostgreSQL complète
3. **`scripts/seed.ts`** - Script d'initialisation des données

### Fichiers modifiés

1. **`shared/schema.ts`** - Ajout du champ `featured` pour les produits
2. **`server/storage.ts`** - Remplacement de `MemStorage` par `PostgresStorage`
3. **`package.json`** - Ajout des scripts `db:seed` et `db:setup`

---

## 🔧 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run db:push` | Crée/met à jour les tables selon le schéma |
| `npm run db:seed` | Ajoute les données d'exemple |
| `npm run db:setup` | Push + Seed (pour premier déploiement) |
| `npm run dev` | Lance le serveur en développement |
| `npm run build` | Build pour production |

---

## 🎯 Workflow de déploiement

### Premier déploiement (base vide)

```bash
# 1. Pusher le code sur Railway/Replit
git push

# 2. Attendre que le build se termine

# 3. Depuis Railway Shell ou terminal Replit :
npm run db:setup

# 4. Vérifier que l'application fonctionne
# Les produits d'exemple devraient apparaître
```

### Redéploiements suivants

```bash
# 1. Pusher le code
git push

# 2. C'est tout ! Les données sont préservées ✅
# Pas besoin de re-seeder
```

### Modification du schéma

Si vous modifiez `shared/schema.ts` (ajout de colonnes, etc.) :

```bash
npm run db:push
```

⚠️ **Attention** : Les modifications destructives (suppression de colonnes) peuvent entraîner une perte de données.

---

## 🔍 Vérification

### Vérifier que PostgreSQL est actif

Les logs au démarrage devraient afficher :

```
✅ PostgreSQL connection established via Neon
```

### Vérifier les données

Accédez à votre dashboard Neon ou utilisez un client PostgreSQL pour voir les tables et données.

### Test rapide

1. Allez sur `/catalog` - Vous devriez voir les produits
2. Créez un produit dans `/admin` - Il devrait persister après redémarrage
3. Créez une commande - Elle devrait être sauvegardée

---

## 🛠️ Dépannage

### Erreur : "DATABASE_URL must be set"

**Cause** : La variable d'environnement `DATABASE_URL` n'est pas configurée.

**Solution** :
1. Vérifiez vos secrets Replit ou variables Railway
2. Assurez-vous que la variable commence par `postgresql://`

### Erreur : "relation does not exist"

**Cause** : Les tables n'ont pas été créées dans la base de données.

**Solution** :
```bash
npm run db:push
```

### Les données d'exemple n'apparaissent pas

**Cause** : Le script de seed n'a pas été exécuté ou a déjà été exécuté.

**Solution** :
1. Vérifiez les logs du seed : "Database already contains products"
2. Si nécessaire, supprimez les données manuellement puis re-seedez

### Les données sont toujours perdues

**Cause possible** : Vous utilisez encore MemStorage au lieu de PostgresStorage.

**Vérification** :
```typescript
// Dans server/storage.ts, à la fin du fichier :
export const storage = postgresStorage; // ✅ Correct
// PAS : export const storage = new MemStorage(); // ❌ Incorrect
```

---

## 📊 Statistiques de performances

### MemStorage (AVANT)

- ⚡ Rapide (RAM)
- ❌ Données volatiles
- ❌ Perte totale au redémarrage
- ❌ Pas de sauvegarde

### PostgresStorage (MAINTENANT)

- ⚡ Performant avec Neon (serverless)
- ✅ Données persistantes
- ✅ Survit aux redéploiements
- ✅ Sauvegarde automatique Neon
- ✅ Accès concurrent sécurisé

---

## 🔗 Ressources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Neon PostgreSQL](https://neon.tech/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## ✨ Prochaines étapes recommandées

1. **Sauvegarde régulière** : Configurez des backups automatiques dans Neon
2. **Monitoring** : Surveillez les performances de la base via Neon dashboard
3. **Optimisation** : Ajoutez des index si nécessaire pour les requêtes fréquentes
4. **Migration** : Utilisez Drizzle Kit pour gérer les migrations de schéma

---

**Dernière mise à jour** : 26 Janvier 2025  
**Version** : 2.0.0 - PostgreSQL Storage
