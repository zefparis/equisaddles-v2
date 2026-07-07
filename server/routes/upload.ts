import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Express } from 'express';

// Configuration multer pour le stockage des images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtrer les types de fichiers acceptés
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers images sont autorisés'));
  }
};

// Configuration multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

export function registerUploadRoutes(app: Express) {
  // Route pour upload d'image unique
  app.post('/api/upload/image', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({
        success: true,
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('Erreur upload:', error);
      res.status(500).json({ error: 'Erreur lors de l\'upload' });
    }
  });

  // Route pour upload multiple d'images
  app.post('/api/upload/images', upload.array('images', 10), (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const uploadedFiles = files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }));

      res.json({
        success: true,
        files: uploadedFiles
      });
    } catch (error) {
      console.error('Erreur upload multiple:', error);
      res.status(500).json({ error: 'Erreur lors de l\'upload multiple' });
    }
  });

  // Route pour supprimer une image
  app.delete('/api/upload/:filename', (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Fichier supprimé' });
      } else {
        res.status(404).json({ error: 'Fichier non trouvé' });
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
  });
}