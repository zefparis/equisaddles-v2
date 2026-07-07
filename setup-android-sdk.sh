#!/bin/bash
set -e

echo "📦 Installation du SDK Android Command Line Tools..."

# Créer le répertoire SDK
SDK_DIR="$HOME/Android/Sdk"
mkdir -p "$SDK_DIR"

# Télécharger les Command Line Tools
echo "📥 Téléchargement des Command Line Tools..."
cd /tmp
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip

# Extraire
echo "📂 Extraction..."
unzip -q cmdline-tools.zip
mkdir -p "$SDK_DIR/cmdline-tools"
mv cmdline-tools "$SDK_DIR/cmdline-tools/latest"

# Nettoyer
rm cmdline-tools.zip

# Accepter les licences et installer les packages nécessaires
echo "📄 Acceptation des licences..."
yes | "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null 2>&1

echo "⚙️  Installation des composants SDK..."
"$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" \
    "platform-tools" \
    "platforms;android-36" \
    "build-tools;35.0.0" \
    "platforms;android-35" \
    "platforms;android-34"

# Mettre à jour local.properties
echo "📝 Mise à jour de local.properties..."
cd "$HOME/Téléchargements/equi"
echo "sdk.dir=$SDK_DIR" > local.properties

# Ajouter ANDROID_HOME au .bashrc si pas déjà présent
if ! grep -q "ANDROID_HOME" "$HOME/.bashrc"; then
    echo "" >> "$HOME/.bashrc"
    echo "# Android SDK" >> "$HOME/.bashrc"
    echo "export ANDROID_HOME=\$HOME/Android/Sdk" >> "$HOME/.bashrc"
    echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools" >> "$HOME/.bashrc"
fi

echo "✅ Installation terminée !"
echo ""
echo "🔄 Pour utiliser le SDK immédiatement, exécutez:"
echo "   export ANDROID_HOME=$SDK_DIR"
echo ""
echo "Ou redémarrez votre terminal pour que les changements prennent effet."
