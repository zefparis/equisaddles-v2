import type { Express } from "express";
import multer from "multer";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "../auth";
import rateLimit from "express-rate-limit";

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

const allowedImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
const allowedMimes = [...allowedImageMimes, ...allowedVideoMimes];

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF, WebP, AVIF, MP4, WebM ou MOV.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (images + videos)
  },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop d\'uploads. Réessayez dans un instant.' },
});

/**
 * Upload un buffer vers Cloudinary
 */
async function uploadToCloudinary(buffer: Buffer, originalName: string): Promise<{ url: string; publicId: string; thumbnailUrl?: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'equi-saddles',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({ url: result.secure_url, publicId: result.public_id });
        } else {
          reject(new Error('Upload failed: no result'));
        }
      }
    );

    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}

async function uploadVideoToCloudinary(buffer: Buffer, originalName: string): Promise<{ url: string; publicId: string; thumbnailUrl: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'equi-saddles',
        resource_type: 'video',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          const thumbnailUrl = cloudinary.url(result.public_id, {
            resource_type: 'video',
            format: 'jpg',
            transformation: [{ width: 600, height: 400, crop: 'fill' }],
          });
          resolve({ url: result.secure_url, publicId: result.public_id, thumbnailUrl });
        } else {
          reject(new Error('Upload failed: no result'));
        }
      }
    );

    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}

function isVideoMime(mime: string): boolean {
  return allowedVideoMimes.includes(mime);
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function getVimeoThumbnail(videoId: string): string {
  return `https://vumbnail.com/${videoId}.jpg`;
}

export function registerCloudinaryUploadRoutes(app: Express) {
  // Vérifier si Cloudinary est configuré via les variables d'environnement
  const isCloudinaryConfigured = !!(
    process.env.CLOUDINARY_URL || 
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );

  // Route pour upload d'image unique (admin only)
  app.post('/api/upload/image', requireAdmin, uploadLimiter, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      let url: string;
      let publicId: string | undefined;

      if (isCloudinaryConfigured) {
        const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        url = result.url;
        publicId = result.publicId;
        console.log(`✅ Image uploaded to Cloudinary: ${url}`);
      } else {
        console.warn("⚠️  Using local storage - image will be lost on redeploy");
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filename = `image-${Date.now()}-${req.file.originalname}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);
        url = `/uploads/${filename}`;
      }

      res.json({
        success: true,
        url,
        publicId,
        mediaType: 'image',
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error: any) {
      console.error('Erreur upload:', error);
      res.status(500).json({ error: `Erreur lors de l'upload: ${error.message}` });
    }
  });

  // Route pour upload multiple d'images (admin only)
  app.post('/api/upload/images', requireAdmin, uploadLimiter, upload.array('images', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const uploadedFiles = [];

      for (const file of files) {
        let url: string;
        let publicId: string | undefined;

        if (isCloudinaryConfigured) {
          const result = await uploadToCloudinary(file.buffer, file.originalname);
          url = result.url;
          publicId = result.publicId;
        } else {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const filename = `image-${Date.now()}-${file.originalname}`;
          const filePath = path.join(uploadDir, filename);
          fs.writeFileSync(filePath, file.buffer);
          url = `/uploads/${filename}`;
        }

        uploadedFiles.push({
          url,
          publicId,
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

  // Route pour upload de média (image ou vidéo) pour la médiathèque (admin only)
  app.post('/api/upload/media', requireAdmin, uploadLimiter, upload.single('media'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const isVideo = isVideoMime(req.file.mimetype);
      let url: string;
      let publicId: string | undefined;
      let thumbnailUrl: string | undefined;

      if (isCloudinaryConfigured) {
        if (isVideo) {
          const result = await uploadVideoToCloudinary(req.file.buffer, req.file.originalname);
          url = result.url;
          publicId = result.publicId;
          thumbnailUrl = result.thumbnailUrl;
        } else {
          const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
          url = result.url;
          publicId = result.publicId;
        }
      } else {
        // Fallback local
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const prefix = isVideo ? 'video' : 'image';
        const filename = `${prefix}-${Date.now()}-${req.file.originalname}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);
        url = `/uploads/${filename}`;
      }

      res.json({
        success: true,
        url,
        publicId,
        thumbnailUrl,
        mediaType: isVideo ? 'video' : 'image',
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error: any) {
      console.error('Erreur upload média:', error);
      res.status(500).json({ error: `Erreur lors de l'upload: ${error.message}` });
    }
  });

  // Route pour résoudre une URL YouTube/Vimeo (admin only)
  app.post('/api/upload/external-video', requireAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL requise' });
      }

      const youtubeId = extractYouTubeId(url);
      if (youtubeId) {
        return res.json({
          success: true,
          mediaType: 'youtube',
          url: `https://www.youtube.com/embed/${youtubeId}`,
          thumbnailUrl: getYouTubeThumbnail(youtubeId),
          videoId: youtubeId,
        });
      }

      const vimeoId = extractVimeoId(url);
      if (vimeoId) {
        return res.json({
          success: true,
          mediaType: 'vimeo',
          url: `https://player.vimeo.com/video/${vimeoId}`,
          thumbnailUrl: getVimeoThumbnail(vimeoId),
          videoId: vimeoId,
        });
      }

      return res.status(400).json({ error: 'URL YouTube ou Vimeo invalide' });
    } catch (error: any) {
      res.status(500).json({ error: `Erreur: ${error.message}` });
    }
  });

  // Route pour supprimer une image (admin only, Cloudinary only)
  app.delete('/api/upload/:publicId', requireAdmin, async (req, res) => {
    try {
      if (!isCloudinaryConfigured) {
        return res.status(501).json({ error: 'Cloudinary not configured' });
      }

      const { publicId } = req.params;

      // Validation stricte du publicId : lettres, chiffres, tiret, underscore, slash uniquement
      // Refuser .., backslash, URL complète, caractères de contrôle, publicId vide
      if (!publicId || publicId.length === 0) {
        return res.status(400).json({ error: 'publicId requis' });
      }
      if (publicId.includes('..') || publicId.includes('\\') || publicId.includes('://')) {
        return res.status(400).json({ error: 'publicId invalide' });
      }
      if (!/^[a-zA-Z0-9_\/-]+$/.test(publicId)) {
        return res.status(400).json({ error: 'publicId contient des caractères non autorisés' });
      }

      const result = await cloudinary.uploader.destroy(`equi-saddles/${publicId}`, {
        resource_type: 'auto',
      });
      
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
