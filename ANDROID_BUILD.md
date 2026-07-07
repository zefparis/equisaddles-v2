# Guide de génération du .aab Android

## ✅ Préparation terminée

### Versions mises à jour
- **versionCode**: 2
- **versionName**: "2.0"
- **targetSdkVersion**: 36
- **compileSdkVersion**: 36

### Configuration
- ✓ Fichiers de configuration synchronisés
- ✓ Dépendances Android à jour
- ✓ Keystore configuré
- ✓ Signature release configurée

---

## 📋 Étapes pour générer le .aab

### 1. Configurer les mots de passe du keystore

Éditez le fichier `app/keystore.properties` et remplacez les placeholders par vos vrais mots de passe :

```properties
storePassword=VOTRE_MOT_DE_PASSE_KEYSTORE
keyPassword=VOTRE_MOT_DE_PASSE_KEY
keyAlias=EquiSaddles
storeFile=../android.keystore
```

⚠️ **IMPORTANT**: Ne commitez jamais ce fichier avec les vrais mots de passe (il est déjà dans .gitignore)

---

### 2. Nettoyer les builds précédents (optionnel)

```bash
./gradlew clean
```

---

### 3. Générer le .aab signé

```bash
./gradlew bundleRelease
```

Le fichier `.aab` sera généré dans :
```
app/build/outputs/bundle/release/app-release.aab
```

---

## 🚀 Upload sur Google Play Console

1. Connectez-vous à [Google Play Console](https://play.google.com/console/)
2. Sélectionnez votre application **Equi Saddles**
3. Allez dans **Production** → **Créer une version**
4. Uploadez le fichier `app-release.aab`
5. Remplissez les notes de version
6. Soumettez pour examen

---

## 🔍 Vérifications importantes

### Avant de soumettre, vérifiez :

- [ ] Le fichier `public/manifest.json` est bien accessible sur https://www.equisaddles.com/manifest.json
- [ ] Les icônes PWA sont présentes et accessibles
- [ ] L'application web fonctionne correctement sur mobile
- [ ] Le paramètre `?pwa=true` est bien ajouté au startUrl

### Test local de l'APK (optionnel)

Si vous voulez tester avant d'uploader :

```bash
# Générer un APK debug pour tester
./gradlew assembleDebug

# L'APK sera dans:
# app/build/outputs/apk/debug/app-debug.apk
```

---

## 📝 Notes de version suggérées

**Version 2.0 - [Date]**

Nouveautés :
- ✨ Système de produits en vedette sur la page d'accueil
- 🎨 Interface utilisateur améliorée
- 🐛 Corrections de bugs et améliorations de performance
- 📱 Support Android 15 (API 36)

---

## 🆘 Résolution de problèmes

### Erreur de signature
Si vous obtenez une erreur de signature, vérifiez :
- Les mots de passe dans `app/keystore.properties`
- Le chemin vers le keystore est correct
- Le keystore existe bien à la racine du projet

### Erreur de build
```bash
# Réinstaller les dépendances Gradle
./gradlew clean
rm -rf .gradle
./gradlew bundleRelease
```

### Problème de permissions
```bash
# Rendre gradlew exécutable
chmod +x gradlew
```

---

## 📚 Informations de l'application

- **Package ID**: com.equisaddles.www.twa
- **URL**: https://www.equisaddles.com
- **Type**: Trusted Web Activity (TWA)
- **Orientation**: Portrait
- **Notifications**: Activées
