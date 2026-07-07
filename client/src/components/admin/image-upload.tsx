import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../../hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  onImageSelect: (imageData: { url: string; file: File }) => void;
  currentImage?: string;
  placeholder?: string;
}

export default function ImageUpload({ onImageSelect, currentImage, placeholder = "Sélectionner une image" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(currentImage || "");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image valide (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image est trop volumineuse. Taille maximale: 5MB",
        variant: "destructive",
      });
      return;
    }

    // Créer l'aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      
      // Créer une URL temporaire pour l'image
      const tempUrl = URL.createObjectURL(file);
      onImageSelect({ url: tempUrl, file });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const clearImage = () => {
    setPreview("");
    onImageSelect({ url: "", file: null as any });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <Label>Image</Label>
      
      {/* Zone de drop */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Aperçu"
              className="max-h-48 mx-auto rounded-lg object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={clearImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Glissez-déposez une image ici ou
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choisir un fichier
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Formats supportés: JPG, PNG, GIF (max 5MB)
            </p>
          </div>
        )}
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Option URL manuelle */}
      <div className="pt-4 border-t">
        <Label htmlFor="manual-url" className="text-sm text-gray-600">
          Ou utiliser une URL d'image
        </Label>
        <Input
          id="manual-url"
          type="url"
          placeholder="https://example.com/image.jpg"
          value={currentImage && !preview.startsWith('data:') ? currentImage : ""}
          onChange={(e) => {
            const url = e.target.value;
            if (url) {
              setPreview(url);
              onImageSelect({ url, file: null as any });
            }
          }}
          className="mt-2"
        />
      </div>
    </div>
  );
}