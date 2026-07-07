# Déploiement sur Railway - Guide Rapide

## Étapes de déploiement

1. **Préparer le repo**
   - Pousse ce code sur GitHub (sans les fichiers Replit supprimés)
   - Assure-toi que le Dockerfile est présent

2. **Créer le projet Railway**
   - Va sur [railway.app](https://railway.app)
   - Clique "New Project" → "Deploy from GitHub"
   - Sélectionne ce repository

3. **Configurer les variables d'environnement**
   Dans Railway → Variables, ajoute :
   ```
   DATABASE_URL=postgresql://...
   STRIPE_SECRET_KEY=sk_...
   VITE_STRIPE_PUBLIC_KEY=pk_...
   BREVO_API_KEY=xkeysib-...
   SESSION_SECRET=your-secret-key
   ```

4. **Base de données (optionnel)**
   - Railway peut provisionner une PostgreSQL
   - Ou garde ta base Neon existante

5. **Déploiement**
   - Railway détecte automatiquement le Dockerfile
   - Le build se lance automatiquement
   - Le serveur écoute `process.env.PORT` (déjà configuré)

6. **Migrations**
   Si nécessaire, via Railway Shell :
   ```bash
   npm run db:push
   ```

## Différences avec Replit

- ✅ Le serveur utilise `process.env.PORT` (compatible Railway)
- ✅ Dockerfile optimisé pour Railway
- ✅ Variables d'environnement via interface Railway
- ✅ Pas de configuration spéciale requise

## Test local

```bash
npm install
npm run build
npm start
```

L'application sera accessible sur le domaine Railway généré automatiquement.
