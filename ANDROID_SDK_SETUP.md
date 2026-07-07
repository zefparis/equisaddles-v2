# Configuration du SDK Android

## ❌ Problème actuel

Le SDK Android installé (`/usr/lib/android-sdk`) ne contient que `platform-tools` mais manque :
- `build-tools` (pour compiler)
- `platforms/android-36` (pour targetSdkVersion 36)
- `platforms/android-35` (recommandé)

---

## ✅ Solution 1 : Installation automatique (RECOMMANDÉ)

J'ai créé un script qui installe automatiquement tous les composants nécessaires :

```bash
./setup-android-sdk.sh
```

Ce script va :
1. Télécharger Android Command Line Tools
2. Installer les packages nécessaires dans `~/Android/Sdk`
3. Accepter les licences
4. Mettre à jour `local.properties`
5. Configurer les variables d'environnement

**Temps d'installation** : ~5-10 minutes (selon votre connexion)

Après l'installation, redémarrez votre terminal ou exécutez :
```bash
export ANDROID_HOME=$HOME/Android/Sdk
./gradlew bundleRelease
```

---

## 🔧 Solution 2 : Installation manuelle via Android Studio

Si vous prévoyez de faire du développement Android :

1. **Télécharger Android Studio** : https://developer.android.com/studio
2. **Installer** et ouvrir Android Studio
3. **SDK Manager** (Tools → SDK Manager)
4. Installer :
   - Android SDK Platform 36 (API 36)
   - Android SDK Build-Tools 35.0.0
   - Android SDK Platform-Tools
5. Mettre à jour `local.properties` avec le chemin du SDK
   (généralement `~/Android/Sdk`)

---

## 🐳 Solution 3 : Build avec Docker (Sans installation)

Si vous voulez juste générer le .aab sans installer Android SDK :

### Étape 1 : Créer le Dockerfile

```dockerfile
FROM mingc/android-build-box:latest

WORKDIR /app
COPY . .

RUN chmod +x gradlew
RUN ./gradlew bundleRelease

CMD ["cp", "app/build/outputs/bundle/release/app-release.aab", "/output/"]
```

### Étape 2 : Builder avec Docker

```bash
# Build l'image
docker build -t equi-android .

# Créer le dossier de sortie
mkdir -p output

# Générer le .aab
docker run --rm -v $(pwd)/output:/output equi-android

# Le .aab sera dans ./output/app-release.aab
```

**Avantages** : Pas besoin d'installer Android SDK
**Inconvénients** : Nécessite Docker, téléchargement de ~4GB

---

## 🚀 Solution 4 : Utiliser Bubblewrap CLI (Alternative)

Si vous avez déjà utilisé Bubblewrap pour générer cette app :

```bash
# Installer bubblewrap-cli (si pas déjà fait)
npm install -g @bubblewrap/cli

# Regénérer le projet avec les nouvelles versions
bubblewrap update

# Builder
bubblewrap build
```

Bubblewrap gère le SDK Android automatiquement.

---

## 📋 Vérification de l'installation

Après installation, vérifiez que tout est OK :

```bash
# Vérifier ANDROID_HOME
echo $ANDROID_HOME

# Vérifier les outils
which adb
which sdkmanager

# Lister les packages installés
sdkmanager --list_installed

# Tester le build
./gradlew clean
./gradlew bundleRelease
```

---

## 🆘 Dépannage

### Permission denied sur gradlew
```bash
chmod +x gradlew
```

### Erreur de licence
```bash
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
```

### Build-tools ou platform manquant
```bash
sdkmanager "build-tools;35.0.0"
sdkmanager "platforms;android-36"
```

---

## 🎯 Ma recommandation

Pour votre cas (génération one-shot du .aab) :

**→ Utilisez Solution 1 (script automatique)**

C'est le plus rapide et léger (~2GB vs 4GB pour Docker ou 8GB pour Android Studio).

```bash
./setup-android-sdk.sh
```

Puis après redémarrage du terminal :
```bash
./gradlew bundleRelease
```
