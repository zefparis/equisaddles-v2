// Script de configuration pour le déploiement
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up deployment...');

// 1. Créer le répertoire d'images dans dist/public
const imagesDir = path.join(__dirname, 'dist', 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log('✅ Created images directory');
}

// 2. Copier toutes les images de public/images vers dist/public/images
const sourceImagesDir = path.join(__dirname, 'public', 'images');
if (fs.existsSync(sourceImagesDir)) {
  const imageFiles = fs.readdirSync(sourceImagesDir);
  
  imageFiles.forEach(file => {
    const sourcePath = path.join(sourceImagesDir, file);
    const destPath = path.join(imagesDir, file);
    
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file}`);
    }
  });
}

// 3. Créer les images manquantes pour les accessoires en utilisant des images existantes
const requiredImages = [
  'selle1.jpg', 'selle2.jpg', 'cross.jpg', 'mixte.jpg', 'obstacle.webp', 'poney.jpg',
  'sangle1.jpg', 'etrivieres1.jpg', 'etriers1.jpg', 'amortisseur1.jpg', 
  'tapis1.jpg', 'bridon1.jpg', 'couverture1.jpg', 'protections1.jpg',
  'fond-background1.jpg' // Image de fond ajoutée
];

const fallbackImages = ['selle1.jpg', 'selle2.jpg'];

requiredImages.forEach(imageName => {
  const imagePath = path.join(imagesDir, imageName);
  
  if (!fs.existsSync(imagePath)) {
    // Utiliser une image de fallback
    const fallbackImage = fallbackImages.find(fallback => 
      fs.existsSync(path.join(imagesDir, fallback))
    );
    
    if (fallbackImage) {
      const fallbackPath = path.join(imagesDir, fallbackImage);
      fs.copyFileSync(fallbackPath, imagePath);
      console.log(`✅ Created ${imageName} using ${fallbackImage} as fallback`);
    }
  }
});

// 4. Copier aussi les autres assets nécessaires
const publicDir = path.join(__dirname, 'public');
const distPublicDir = path.join(__dirname, 'dist', 'public');

// Copier les icônes
const iconsSource = path.join(publicDir, 'icons');
const iconsTarget = path.join(distPublicDir, 'icons');

if (fs.existsSync(iconsSource) && !fs.existsSync(iconsTarget)) {
  fs.mkdirSync(iconsTarget, { recursive: true });
  const iconFiles = fs.readdirSync(iconsSource);
  
  iconFiles.forEach(file => {
    const sourcePath = path.join(iconsSource, file);
    const destPath = path.join(iconsTarget, file);
    
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied icon ${file}`);
    }
  });
}

// Copier les autres fichiers nécessaires
const otherFiles = ['manifest.webmanifest', 'sw.js'];

otherFiles.forEach(fileName => {
  const sourcePath = path.join(publicDir, fileName);
  const destPath = path.join(distPublicDir, fileName);
  
  if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${fileName}`);
  }
});

console.log('🎉 Deployment setup complete!');
console.log(`📁 Images directory: ${imagesDir}`);
console.log(`📊 Total images: ${fs.readdirSync(imagesDir).length}`);
