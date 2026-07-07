# 📱 Guide de déploiement iOS - Equi Saddles

## ✅ Configuration terminée

Le projet Capacitor iOS est **prêt** et configuré :

```
✓ @capacitor/core installé
✓ @capacitor/cli installé  
✓ @capacitor/ios installé
✓ Projet Xcode créé dans ios/
✓ capacitor.config.ts configuré
✓ Info.plist optimisé (orientation portrait, status bar)
✓ Build synchronisé dans ios/App/App/public/
```

## 📋 Prérequis

- **macOS** avec Xcode 14+ installé
- **Compte Apple Developer** (99$/an)
- **Certificat de distribution** iOS

## 🚀 Étapes de déploiement

### 1️⃣ Ouvrir le projet dans Xcode

```bash
npx cap open ios
```

Ou manuellement :
```bash
open ios/App/App.xcworkspace
```

### 2️⃣ Configuration du projet dans Xcode

#### a) Signing & Capabilities
1. Sélectionner le projet **App** dans le navigateur de gauche
2. Aller dans l'onglet **Signing & Capabilities**
3. Cocher **Automatically manage signing**
4. Sélectionner votre **Team** (compte Apple Developer)
5. Vérifier le **Bundle Identifier** : `com.equisaddles.www`

#### b) Version & Build
1. Dans **General** :
   - **Version** : `1.0.0`
   - **Build** : `1`
   - **Deployment Target** : iOS 13.0 minimum

### 3️⃣ Tester sur appareil physique

1. Brancher un iPhone via USB
2. Sélectionner l'appareil dans la barre supérieure Xcode
3. Cliquer sur ▶️ **Run**
4. L'app se lancera et affichera **https://www.equisaddles.com**

⚠️ **Vérifications :**
- Le logo Equi Saddles apparaît correctement
- La navigation fonctionne
- L'orientation est bloquée en portrait
- La barre de statut est claire (light content)

### 4️⃣ Créer l'archive pour App Store

1. Dans Xcode, menu **Product** → **Archive**
2. Attendre la fin du build (2-5 minutes)
3. Une fois terminé, l'**Organizer** s'ouvre automatiquement

### 5️⃣ Distribuer vers App Store Connect

1. Dans **Organizer**, sélectionner l'archive créée
2. Cliquer sur **Distribute App**
3. Choisir **App Store Connect**
4. Sélectionner **Upload**
5. Suivre les étapes (automatic signing, options de distribution)
6. Cliquer sur **Upload**

⏱️ L'upload prend 5-15 minutes selon la connexion.

### 6️⃣ App Store Connect - Configuration

1. Aller sur [App Store Connect](https://appstoreconnect.apple.com)
2. **Mes apps** → **+ Nouvelle app**
3. Remplir :
   - **Nom** : Equi Saddles
   - **Langue principale** : Français
   - **Bundle ID** : com.equisaddles.www
   - **SKU** : EQUISADDLES-001
   - **Accès utilisateur** : Accès complet

#### Métadonnées requises :
- **Icône** : 1024x1024 PNG (utiliser `/public/icons/icon-512.png` redimensionné)
- **Captures d'écran** : 
  - iPhone 6.5" (1242 x 2688 pixels) - 3 à 10 captures
  - iPhone 5.5" (1242 x 2208 pixels) - 3 à 10 captures
- **Description** : 
  ```
  Equi Saddles - Boutique en ligne spécialisée dans les selles d'équitation 
  haut de gamme : Obstacle, Dressage, Cross, Mixte, Poney.
  
  Découvrez notre sélection premium de selles d'occasion révisées et 
  contrôlées par des professionnels.
  ```
- **Mots-clés** : équitation,selle,cheval,obstacle,dressage,poney,boutique
- **Catégorie** : Shopping
- **Catégorie secondaire** : Sports
- **Âge** : 4+

### 7️⃣ Soumission pour review

1. Attendre que le build soit **traité** (30 min - 2h)
2. Dans **App Store Connect**, sélectionner le build uploadé
3. Remplir toutes les informations requises
4. Cliquer sur **Soumettre pour examen**

⏱️ **Temps de review Apple** : 24h - 72h en général

## 🔄 Workflow de mise à jour

Pour chaque nouvelle version :

```bash
# 1. Build le frontend
npm run build

# 2. Synchroniser avec iOS
npx cap sync ios

# 3. Ouvrir dans Xcode
npx cap open ios

# 4. Incrémenter la version dans Xcode
# General → Version: 1.0.1, Build: 2

# 5. Product → Archive → Distribute
```

## 🎨 Icônes et Splash Screen

### Icônes
Les icônes sont gérées par Capacitor automatiquement depuis :
- `/public/icons/icon-*.png`

Pour personnaliser, utiliser un outil comme [App Icon Generator](https://www.appicon.co/)

### Splash Screen
1. Créer une image `splash.png` (2732 x 2732 px)
2. Placer dans `ios/App/App/Assets.xcassets/Splash.imageset/`
3. Configurer dans `LaunchScreen.storyboard`

## 🔒 Certificats et Provisioning

Xcode gère automatiquement si **Automatically manage signing** est activé.

Pour un contrôle manuel :
1. Apple Developer Portal → Certificates
2. Créer un **iOS Distribution Certificate**
3. Créer un **App Store Provisioning Profile**
4. Télécharger et installer dans Xcode

## 📊 Analytics et monitoring

Recommandations :
- **Firebase Analytics** pour le tracking
- **Sentry** pour les crash reports
- **TestFlight** pour les beta tests

## ❓ Troubleshooting

### Build failed - Code signing error
→ Vérifier que le compte Apple Developer est actif  
→ Regénérer les certificats dans Xcode

### App crashes au démarrage
→ Vérifier la console Xcode pour les logs  
→ Tester avec `npx cap run ios --livereload`

### Icônes ne s'affichent pas
→ `npx cap sync ios`  
→ Clean build : Cmd+Shift+K dans Xcode

### URL ne charge pas
→ Vérifier `capacitor.config.ts` → `server.url`  
→ Vérifier la connexion internet sur l'appareil

## 📞 Support

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [App Store Connect Help](https://developer.apple.com/support/app-store-connect/)
- [Guidelines iOS](https://developer.apple.com/app-store/review/guidelines/)

---

✅ **Configuration actuelle :**
- App ID : `com.equisaddles.www`
- App Name : `Equi Saddles`
- Version initiale : `1.0.0`
- Orientation : Portrait uniquement
- Server URL : `https://www.equisaddles.com`
