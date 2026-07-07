# Configuration des Secrets - Equi Saddles

## Secrets déjà configurés ✅

Les secrets suivants sont déjà configurés dans votre environnement Replit :

- `DATABASE_URL` - URL de connexion PostgreSQL
- `STRIPE_SECRET_KEY` - Clé secrète Stripe pour les paiements (✓ Mise à jour le 28/07/2025)
- `VITE_STRIPE_PUBLIC_KEY` - Clé publique Stripe pour le frontend (✓ Mise à jour le 28/07/2025)
- `STRIPE_WEBHOOK_SECRET` - Secret de signature webhook Stripe (⚠️ À CONFIGURER - Requis pour la sécurité)
- `BREVO_API_KEY` - Clé API Brevo pour les emails (✓ Mise à jour le 28/07/2025)
- `SESSION_SECRET` - Secret pour les sessions utilisateur

## Comment ajouter d'autres secrets

Si vous devez ajouter d'autres secrets à l'avenir :

1. Allez dans les **Secrets** de votre Repl
2. Cliquez sur **+ New Secret**
3. Ajoutez le nom et la valeur du secret
4. Le secret sera automatiquement disponible comme variable d'environnement

## Secrets optionnels utiles

### Pour les abonnements Stripe
- `STRIPE_PRICE_ID` - ID du prix d'abonnement (commence par `price_`)

## Informations importantes

- **Ne jamais** inclure les vraies clés dans le code source
- Utilisez le fichier `.env.example` comme référence
- Les secrets Replit sont automatiquement injectés dans l'environnement
- Les variables `VITE_*` sont exposées au frontend (utilisez seulement pour les clés publiques)

## Structure actuelle

Votre application utilise actuellement :
- PostgreSQL sur Neon pour la base de données
- Stripe pour les paiements
- Brevo pour les notifications email
- Sessions sécurisées avec PostgreSQL store