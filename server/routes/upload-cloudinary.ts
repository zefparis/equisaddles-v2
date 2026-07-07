import type { Express } from "express";
import multer from "multer";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// Configuration Cloudinary
if (process.env.CLOUDINARY_URL) {
  // Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
  console.log("✅ Cloudinary configured with URL");
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("✅ Cloudinary configured with credentials");
} else {
  console.warn("⚠️  Cloudinary not configured - set CLOUDINARY_URL environment variable");
}

// Configuration multer pour stocker en mémoire avant upload vers Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

/**
 * Upload un buffer vers Cloudinary
 */
async function uploadToCloudinary(buffer: Buffer, originalName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'equi-saddles',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed: no result'));
        }
      }
    );

    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}

export function registerCloudinaryUploadRoutes(app: Express) {
  // Vérifier si Cloudinary est configuré via les variables d'environnement
  const isCloudinaryConfigured = !!(
    process.env.CLOUDINARY_URL || 
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );

  // Route pour upload d'image unique
  app.post('/api/upload/image', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      let imageUrl: string;

      if (isCloudinaryConfigured) {
        // Upload vers Cloudinary
        imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        console.log(`✅ Image uploaded to Cloudinary: ${imageUrl}`);
      } else {
        // Fallback : stockage local (sera perdu au redéploiement)
        console.warn("⚠️  Using local storage - image will be lost on redeploy");
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filename = `image-${Date.now()}-${req.file.originalname}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);
        imageUrl = `/uploads/${filename}`;
      }

      res.json({
        success: true,
        url: imageUrl,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error: any) {
      console.error('Erreur upload:', error);
      res.status(500).json({ error: `Erreur lors de l'upload: ${error.message}` });
    }
  });

  // Route pour upload multiple d'images
  app.post('/api/upload/images', upload.array('images', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const uploadedFiles = [];

      for (const file of files) {
        let imageUrl: string;

        if (isCloudinaryConfigured) {
          imageUrl = await uploadToCloudinary(file.buffer, file.originalname);
        } else {
          // Fallback local
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const filename = `image-${Date.now()}-${file.originalname}`;
          const filePath = path.join(uploadDir, filename);
          fs.writeFileSync(filePath, file.buffer);
          imageUrl = `/uploads/${filename}`;
        }

        uploadedFiles.push({
          url: imageUrl,
          filename: file.originalname,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
      }

      res.json({
        success: true,
        files: uploadedFiles
      });
    } catch (error: any) {
      console.error('Erreur upload multiple:', error);
      res.status(500).json({ error: `Erreur lors de l'upload multiple: ${error.message}` });
    }
  });

  // Route pour supprimer une image (uniquement Cloudinary)
  app.delete('/api/upload/:publicId', async (req, res) => {
    try {
      if (!isCloudinaryConfigured) {
        return res.status(501).json({ error: 'Cloudinary not configured' });
      }

      const { publicId } = req.params;
      const result = await cloudinary.uploader.destroy(`equi-saddles/${publicId}`);
      
      res.json({
        success: result.result === 'ok',
        message: result.result === 'ok' ? 'Image supprimée' : 'Image non trouvée'
      });
    } catch (error: any) {
      console.error('Erreur suppression:', error);
      res.status(500).json({ error: `Erreur lors de la suppression: ${error.message}` });
    }
  });
}
