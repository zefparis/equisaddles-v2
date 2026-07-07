import { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X, Upload, Image as ImageIcon, Star, Move, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface ImageData {
  id: string;
  url: string;
  file?: File;
  isMain?: boolean;
  caption?: string;
}

interface MultiImageUploadProps {
  images: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
  maxImages?: number;
  productId?: number;
}

export default function MultiImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  productId
}: MultiImageUploadProps) {
  const { toast } = useToast();
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast({
        title: "Limite atteinte",
        description: `Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s)`,
        variant: "destructive"
      });
      return;
    }

    const newImages: ImageData[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData: ImageData = {
            id: `temp-${Date.now()}-${Math.random()}`,
            url: e.target?.result as string,
            file: file,
            isMain: images.length === 0 && newImages.length === 0
          };
          newImages.push(imageData);
          
          if (newImages.length === files.length) {
            onImagesChange([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [images, maxImages, onImagesChange, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast({
        title: "Limite atteinte",
        description: `Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s)`,
        variant: "destructive"
      });
      return;
    }

    const newImages: ImageData[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData: ImageData = {
            id: `temp-${Date.now()}-${Math.random()}`,
            url: e.target?.result as string,
            file: file,
            isMain: images.length === 0 && newImages.length === 0
          };
          newImages.push(imageData);
          
          if (newImages.length === files.length) {
            onImagesChange([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [images, maxImages, onImagesChange, toast]);

  const removeImage = useCallback((imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // Si on supprime l'image principale, définir la première image comme principale
    const removedImage = images.find(img => img.id === imageId);
    if (removedImage?.isMain && updatedImages.length > 0) {
      updatedImages[0].isMain = true;
    }
    
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const setMainImage = useCallback((imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isMain: img.id === imageId
    }));
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const updateCaption = useCallback((imageId: string, caption: string) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, caption } : img
    );
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const handleImageDragStart = useCallback((e: React.DragEvent, imageId: string) => {
    setDraggedImage(imageId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleImageDragEnd = useCallback(() => {
    setDraggedImage(null);
  }, []);

  const handleImageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedImage || draggedImage === targetId) return;

    const draggedIndex = images.findIndex(img => img.id === draggedImage);
    const targetIndex = images.findIndex(img => img.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedItem);

    onImagesChange(newImages);
    setDraggedImage(null);
  }, [draggedImage, images, onImagesChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Images du produit</Label>
        <Badge variant="outline">
          {images.length}/{maxImages} images
        </Badge>
      </div>

      {/* Zone de drop pour nouvelles images */}
      {images.length < maxImages && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDraggingOver 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Glissez-déposez vos images ici ou
          </p>
          <Label htmlFor="multi-image-upload" className="cursor-pointer">
            <Button type="button" variant="outline" asChild>
              <span>
                <ImageIcon className="h-4 w-4 mr-2" />
                Sélectionner des images
              </span>
            </Button>
          </Label>
          <Input
            id="multi-image-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <p className="text-xs text-gray-500 mt-2">
            Formats acceptés : JPG, PNG, GIF, WebP (max {maxImages} images)
          </p>
        </div>
      )}

      {/* Grille d'images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card
              key={image.id}
              className={`
                relative group overflow-hidden cursor-move
                ${draggedImage === image.id ? 'opacity-50' : ''}
                ${image.isMain ? 'ring-2 ring-primary' : ''}
              `}
              draggable
              onDragStart={(e) => handleImageDragStart(e, image.id)}
              onDragEnd={handleImageDragEnd}
              onDragOver={handleImageDragOver}
              onDrop={(e) => handleImageDrop(e, image.id)}
            >
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Badge image principale */}
                {image.isMain && (
                  <Badge className="absolute top-2 left-2 bg-primary text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Principale
                  </Badge>
                )}

                {/* Numéro d'ordre */}
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  #{index + 1}
                </Badge>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!image.isMain && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setMainImage(image.id)}
                      title="Définir comme image principale"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(image.id)}
                    title="Supprimer l'image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Indicateur de drag */}
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Move className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Légende optionnelle */}
              <CardContent className="p-2">
                <Input
                  type="text"
                  placeholder="Légende (optionnel)"
                  value={image.caption || ""}
                  onChange={(e) => updateCaption(image.id, e.target.value)}
                  className="text-xs"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      {images.length > 0 && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Glissez-déposez pour réorganiser l'ordre des images</p>
          <p>• Cliquez sur l'étoile pour définir l'image principale</p>
          <p>• L'image principale sera affichée en premier sur la fiche produit</p>
        </div>
      )}
    </div>
  );
}
