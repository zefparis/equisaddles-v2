import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductImage, InsertProductImage } from "@shared/schema";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog } from "../ui/dialog";
import { Upload, Download, Trash2, Star, StarOff, Image as ImageIcon } from "lucide-react";
import ImageUpload from "./image-upload";

interface ProductImageManagerProps {
  productId: number;
}

export default function ProductImageManager({ productId }: ProductImageManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    url: "",
    alt: "",
    filename: "",
    originalName: "",
    mimeType: "image/jpeg",
    size: 0,
    isMain: false
  });

  // Fetch product images
  const { data: images, isLoading } = useQuery<ProductImage[]>({
    queryKey: [`/api/products/${productId}/images`],
  });

  // Create image mutation
  const createImageMutation = useMutation({
    mutationFn: (data: InsertProductImage) => apiRequest("POST", `/api/products/${productId}/images`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/images`] });
      setShowUploadDialog(false);
      setSelectedImageFile(null);
      setUploadForm({
        url: "",
        alt: "",
        filename: "",
        originalName: "",
        mimeType: "image/jpeg",
        size: 0,
        isMain: false
      });
      toast({
        title: "Image ajoutée",
        description: "L'image a été ajoutée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'image",
        variant: "destructive",
      });
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => apiRequest("DELETE", `/api/products/${productId}/images/${imageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/images`] });
      toast({
        title: "Image supprimée",
        description: "L'image a été supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'image",
        variant: "destructive",
      });
    },
  });

  // Set main image mutation
  const setMainImageMutation = useMutation({
    mutationFn: (imageId: number) => apiRequest("PUT", `/api/products/${productId}/images/${imageId}/main`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/images`] });
      toast({
        title: "Image principale définie",
        description: "L'image principale a été mise à jour",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible de définir l'image principale",
        variant: "destructive",
      });
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Erreur lors de l'upload de l'image");
    }
    const result = await response.json();
    return result.url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images && images.length >= 5) {
      toast({
        title: "Limite atteinte",
        description: "Vous ne pouvez pas ajouter plus de 5 images.",
        variant: "destructive",
      });
      return;
    }
    try {
      let url = uploadForm.url;
      let filename = uploadForm.filename;
      let originalName = uploadForm.originalName;
      let mimeType = uploadForm.mimeType;
      let size = uploadForm.size;

      if (selectedImageFile) {
        // Upload the local file to get a persistent URL
        url = await uploadImage(selectedImageFile);
        filename = url.split('/').pop() || selectedImageFile.name;
        originalName = selectedImageFile.name;
        mimeType = selectedImageFile.type || 'image/jpeg';
        size = selectedImageFile.size;
      }

      // Generate filename from URL if still missing
      const finalFilename = filename || (url ? (url.split('/').pop() || 'image.jpg') : 'image.jpg');

      createImageMutation.mutate({
        productId,
        url,
        alt: uploadForm.alt || finalFilename,
        filename: finalFilename,
        originalName: originalName || finalFilename,
        mimeType: mimeType || 'image/jpeg',
        size: size || 1000,
        isMain: uploadForm.isMain,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Upload impossible. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (image: ProductImage) => {
    const filename = image.filename || image.url.split('/').pop() || 'image.jpg';
    const link = document.createElement('a');
    link.href = `/api/images/download/${filename}`;
    link.download = image.originalName || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Téléchargement démarré",
      description: "Le téléchargement de l'image a commencé",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Images: <span className="font-medium">{images?.length || 0}/5</span>{" "}
          {images && images.length < 3 && (
            <span className="text-amber-600 ml-2">Minimum recommandé: 3 images</span>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Images du produit</h3>
        <Button
          onClick={() => setShowUploadDialog((v) => !v)}
          disabled={!!images && images.length >= 5}
        >
          <Upload className="mr-2 h-4 w-4" />
          {showUploadDialog ? "Fermer" : "Ajouter une image"}
        </Button>
      </div>

      {showUploadDialog && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ajouter une nouvelle image</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ImageUpload
                onImageSelect={({ url, file }) => {
                  setSelectedImageFile(file);
                  if (file) {
                    setUploadForm({
                      ...uploadForm,
                      url: "",
                      filename: file.name || uploadForm.filename,
                      originalName: file.name || uploadForm.originalName,
                      mimeType: file.type || uploadForm.mimeType,
                      size: file.size || uploadForm.size,
                    });
                  } else {
                    setUploadForm({ ...uploadForm, url });
                  }
                }}
                currentImage={uploadForm.url}
                placeholder="Sélectionner une image (téléphone/ordinateur)"
              />
              <div>
                <Label htmlFor="url">URL de l'image</Label>
                <Input
                  id="url"
                  type={selectedImageFile ? "text" : "url"}
                  value={uploadForm.url}
                  onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                  placeholder="/images/selle-example.jpg"
                  required={!selectedImageFile && !uploadForm.url}
                />
                {selectedImageFile && (
                  <p className="text-xs text-gray-500 mt-1">Une URL n'est pas nécessaire quand un fichier est sélectionné.</p>
                )}
              </div>
              <div>
                <Label htmlFor="alt">Texte alternatif</Label>
                <Input
                  id="alt"
                  value={uploadForm.alt}
                  onChange={(e) => setUploadForm({ ...uploadForm, alt: e.target.value })}
                  placeholder="Description de l'image"
                  
                />
              </div>
              <div>
                <Label htmlFor="filename">Nom du fichier</Label>
                <Input
                  id="filename"
                  value={uploadForm.filename}
                  onChange={(e) => setUploadForm({ ...uploadForm, filename: e.target.value })}
                  placeholder="selle-example.jpg"
                />
              </div>
              <div>
                <Label htmlFor="originalName">Nom original</Label>
                <Input
                  id="originalName"
                  value={uploadForm.originalName}
                  onChange={(e) => setUploadForm({ ...uploadForm, originalName: e.target.value })}
                  placeholder="Nom original du fichier"
                />
              </div>
              <div className="flex items-center space-x-2">
                {/* FIX: label for/id - Changed input to Checkbox component for consistency */}
                <Checkbox
                  id="isMain"
                  checked={uploadForm.isMain}
                  onCheckedChange={(checked: boolean) => setUploadForm({ ...uploadForm, isMain: checked })}
                />
                <Label htmlFor="isMain">Image principale</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createImageMutation.isPending || (!!images && images.length >= 5)}>
                  {createImageMutation.isPending ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images?.map((image) => (
          <Card key={image.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4" />
                  <CardTitle className="text-sm">{image.alt}</CardTitle>
                </div>
                {image.isMain && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Principal
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-xs text-gray-600">
                  <div>Fichier: {image.filename}</div>
                  <div>Taille: {(image.size / 1024).toFixed(1)} KB</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(image)}
                      className="px-2"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMainImageMutation.mutate(image.id)}
                      disabled={image.isMain || setMainImageMutation.isPending}
                      className="px-2"
                    >
                      {image.isMain ? <StarOff className="h-3 w-3" /> : <Star className="h-3 w-3" />}
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteImageMutation.mutate(image.id)}
                    disabled={deleteImageMutation.isPending}
                    className="px-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!images || images.length === 0 ? (
        <div className="text-center py-8">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Aucune image trouvée pour ce produit</p>
          <p className="text-sm text-gray-400 mt-2">Cliquez sur "Ajouter une image" pour commencer</p>
        </div>
      ) : null}
    </div>
  );
}