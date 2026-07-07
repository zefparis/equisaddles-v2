// Script pour copier les images vers le répertoire de build
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'public', 'images');
const targetDir = path.join(__dirname, 'dist', 'public', 'images');

console.log('📁 Copying images to build directory...');
console.log('Source:', sourceDir);
console.log('Target:', targetDir);

// Créer le répertoire de destination s'il n'existe pas
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('✅ Created target directory');
}

// Copier tous les fichiers du répertoire source
if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Copied ${file}`);
  });
  
  // Créer les images manquantes pour les accessoires
  const accessoryImages = [
    'sangle1.jpg', 'etrivieres1.jpg', 'etriers1.jpg', 
    'amortisseur1.jpg', 'tapis1.jpg', 'bridon1.jpg', 
    'couverture1.jpg', 'protections1.jpg'
  ];
  
  const fallbackImage = path.join(targetDir, 'selle1.jpg');
  
  accessoryImages.forEach(imageName => {
    const imagePath = path.join(targetDir, imageName);
    if (!fs.existsSync(imagePath) && fs.existsSync(fallbackImage)) {
      fs.copyFileSync(fallbackImage, imagePath);
      console.log(`✅ Created fallback image ${imageName}`);
    }
  });
  
  console.log('🎉 All images copied successfully!');
} else {
  console.error('❌ Source directory does not exist:', sourceDir);
}
