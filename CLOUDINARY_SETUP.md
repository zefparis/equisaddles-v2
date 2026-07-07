# ☁️ Configuration Cloudinary - Equi Saddles

## 🎯 Problème résolu

**AVANT** : Les images étaient stockées dans `/public/uploads/` localement  
**Résultat** : ❌ Images **supprimées à chaque redéploiement** Railway

**MAINTENANT** : Les images sont stockées sur Cloudinary CDN  
**Résultat** : ✅ Images **persistantes** et **optimisées** automatiquement

---

## 📋 Pourquoi Cloudinary ?

- ✅ **Stockage permanent** : Les images ne sont jamais perdues
- ✅ **CDN rapide** : Chargement ultra-rapide partout dans le monde
- ✅ **Optimisation auto** : Compression et format adapté (WebP, etc.)
- ✅ **Gratuit** : 25 GB de stockage et 25k transformations/mois
- ✅ **Transformations** : Redimensionnement automatique (max 1200x1200)

---

## 🚀 Configuration (5 minutes)

### Étape 1 : Créer un compte Cloudinary

1. Allez sur https://cloudinary.com/users/register_free
2. Créez votre compte (gratuit)
3. Confirmez votre email

### Étape 2 : Récupérer vos credentials

Une fois connecté au dashboard Cloudinary :

1. Allez dans **Dashboard** (page d'accueil)
2. Vous verrez une section **Account Details** avec :
   - **Cloud name** : `dxxxxxx`
   - **API Key** : `123456789012345`
   - **API Secret** : `xxxxxxxxxxxxxxxxxxxx`

### Étape 3 : Configurer Railway

Dans votre projet Railway :

1. Allez dans **Variables**
2. Cliquez sur **+ New Variable**
3. Ajoutez **une seule** de ces options :

#### Option A : URL complète (Recommandé)

```
Nom  : CLOUDINARY_URL
Valeur: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

**Exemple** :
```
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrst@dxxxxxx
```

#### Option B : Variables séparées

```
CLOUDINARY_CLOUD_NAME=dxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrst
```

### Étape 4 : Redéployer

Railway va automatiquement redéployer avec la nouvelle configuration.

---

## 🧪 Tester

### 1. Créer un produit avec image

1. Allez sur `/admin`
2. Créez une nouvelle selle
3. Uploadez une image
4. **Vérifiez dans les logs Railway** :
   ```
   ✅ Cloudinary configured
   ✅ Image uploaded to Cloudinary: https://res.cloudinary.com/...
   ```

### 2. Vérifier la persistance

1. **Redéployez l'application** (commit + push)
2. Une fois redéployé, retournez voir le produit
3. ✅ **L'image devrait toujours être visible !**

### 3. Vérifier dans Cloudinary Dashboard

1. Allez sur https://console.cloudinary.com/
2. **Media Library** → **Assets**
3. Vous devriez voir vos images dans le dossier `equi-saddles`

---

## 📊 Format des URLs

### Avant (local - perdues au redéploiement)
```
/uploads/image-1234567890-selle.jpg
```

### Maintenant (Cloudinary - persistantes)
```
https://res.cloudinary.com/dxxxxxx/image/upload/v1234567890/equi-saddles/abc123.jpg
```

---

## 🔧 Fonctionnalités

### Optimisations automatiques

Les images sont automatiquement :
- ✅ **Redimensionnées** : Max 1200x1200px
- ✅ **Compressées** : Qualité optimale sans perte visible
- ✅ **Converties** : Format moderne (WebP) selon le navigateur
- ✅ **Mises en cache** : CDN mondial pour chargement rapide

### Transformations appliquées

```javascript
{
  width: 1200,
  height: 1200,
  crop: 'limit',
  quality: 'auto',
  fetch_format: 'auto'
}
```

---

## 🛡️ Sécurité

### Variables d'environnement

- ✅ **Secrets stockés dans Railway** : Jamais dans le code
- ✅ **API Key protégée** : Accès restreint au serveur
- ✅ **Dossier isolé** : `equi-saddles` séparé des autres projets

### Upload sécurisé

- ✅ **Types MIME vérifiés** : JPEG, PNG, GIF, WebP uniquement
- ✅ **Taille limitée** : 5 MB maximum par image
- ✅ **Stockage serveur uniquement** : Les clients ne peuvent pas uploader directement

---

## 🔄 Fallback (mode dégradé)

Si Cloudinary n'est pas configuré, l'application :

- ⚠️ **Stocke localement** dans `/public/uploads/`
- ⚠️ **Log un warning** : "Using local storage - image will be lost on redeploy"
- ⚠️ **Images perdues** au prochain redéploiement

**Message dans les logs** :
```
⚠️  Cloudinary not configured - images will be stored locally
```

---

## 📝 Migration des images existantes

Si vous aviez des images stockées localement :

1. **Téléchargez-les** depuis l'ancien déploiement
2. **Re-uploadez-les** via `/admin` après avoir configuré Cloudinary
3. Les nouvelles URLs Cloudinary seront sauvegardées en base de données

---

## 🎁 Plan gratuit Cloudinary

- **Stockage** : 25 GB
- **Bande passante** : 25 GB/mois
- **Transformations** : 25,000/mois
- **Images** : Illimité

**Pour Equi Saddles**, cela permet :
- ~5000 images de produits (5 MB moyenne)
- ~100,000 vues d'images par mois
- Largement suffisant pour commencer !

---

## 🆘 Dépannage

### "Cannot find module 'cloudinary'"

**Cause** : Package non installé après le commit

**Solution** : Railway installe automatiquement. Attendez la fin du build.

### Images toujours perdues après redéploiement

**Causes possibles** :
1. `CLOUDINARY_URL` mal configurée
2. Credentials incorrects
3. Cloudinary non configuré

**Vérification** :
```bash
# Dans les logs Railway, cherchez :
✅ Cloudinary configured
```

Si vous voyez :
```
⚠️  Cloudinary not configured
```
→ Revérifiez vos variables d'environnement

### Upload échoue avec erreur 401

**Cause** : API Key ou Secret incorrect

**Solution** :
1. Revérifiez vos credentials dans Cloudinary Dashboard
2. Recopiez-les exactement dans Railway Variables
3. Redéployez

---

## 📚 Documentation officielle

- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Transformations](https://cloudinary.com/documentation/image_transformations)

---

## ✅ Checklist de configuration

- [ ] Compte Cloudinary créé
- [ ] Credentials copiés depuis Dashboard
- [ ] Variable `CLOUDINARY_URL` ajoutée dans Railway
- [ ] Application redéployée
- [ ] Log "✅ Cloudinary configured" visible
- [ ] Image uploadée via `/admin`
- [ ] Image visible après redéploiement

---

**Date** : 26 Janvier 2025  
**Version** : 2.2.0 - Cloudinary Integration
