import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const logoPath = join(__dirname, 'public/images/logo.png');
const outputDir = join(__dirname, 'public/icons');

async function generateIcons() {
  console.log('🎨 Génération des icônes PWA...\n');

  // Icônes standard
  for (const size of sizes) {
    const outputPath = join(outputDir, `icon-${size}.png`);
    
    await sharp(logoPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 245, g: 243, b: 239, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ icon-${size}.png`);
  }

  // Icône maskable avec padding (20% de safe zone)
  const maskableSize = 512;
  const contentSize = Math.floor(maskableSize * 0.6); // 40% de padding total
  
  await sharp(logoPath)
    .resize(contentSize, contentSize, {
      fit: 'contain',
      background: { r: 245, g: 243, b: 239, alpha: 1 }
    })
    .extend({
      top: Math.floor((maskableSize - contentSize) / 2),
      bottom: Math.ceil((maskableSize - contentSize) / 2),
      left: Math.floor((maskableSize - contentSize) / 2),
      right: Math.ceil((maskableSize - contentSize) / 2),
      background: { r: 245, g: 243, b: 239, alpha: 1 }
    })
    .png()
    .toFile(join(outputDir, 'icon-512-maskable.png'));
  
  console.log(`✅ icon-512-maskable.png (avec safe zone)`);
  console.log('\n🎉 Toutes les icônes ont été générées avec succès !');
}

generateIcons().catch(console.error);
