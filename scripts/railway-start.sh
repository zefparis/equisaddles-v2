#!/bin/bash
set -e

echo "🚀 Railway startup script"

# Vérifier si les tables existent déjà
echo "📊 Checking database..."

# Exécuter les migrations uniquement si nécessaire
echo "🔧 Running database migrations..."
npm run db:push || echo "⚠️  Migrations may have already run"

# Seed uniquement au premier déploiement
if [ ! -f "/app/.seeded" ]; then
  echo "🌱 Seeding database (first deployment)..."
  npm run db:seed || echo "⚠️  Seed may have already run"
  touch /app/.seeded
else
  echo "✅ Database already seeded"
fi

# Démarrer l'application
echo "🚀 Starting application..."
node dist/index.js
