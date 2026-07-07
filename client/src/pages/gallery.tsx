import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { GalleryImage } from "@shared/schema";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import Lightbox from "../components/ui/lightbox";
import { Images, Filter } from "lucide-react";

const categories = ["Toutes", "Obstacle", "Dressage", "Cross", "Mixte", "Poney", "Autres"];

export default function Gallery() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Scroll to top when page loads
  useEffect(() => {
    scrollToTop();
  }, []);

  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
  });

  const filteredImages = images?.filter(
    (image) => selectedCategory === "Toutes" || image.category === selectedCategory
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const imageUrls = filteredImages?.map(img => img.url) || [];

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Video just under navbar */}
      <section className="relative w-full overflow-hidden">
        <div className="relative h-56 md:h-80 lg:h-96">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/gif.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          {/* Subtle gradient for readability on top of the video */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-transparent pointer-events-none" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Images className="h-10 w-10" />
            {t("nav.gallery")}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t("gallery.description")}
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="font-semibold text-gray-700">{t("gallery.filterBy")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="mb-2"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 aspect-square rounded-lg mb-2"></div>
                <div className="bg-gray-300 h-4 rounded mb-1"></div>
                <div className="bg-gray-300 h-3 rounded w-20"></div>
              </div>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        {!isLoading && (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredImages?.length || 0} {filteredImages?.length !== 1 ? t("gallery.imagesCount") : t("gallery.imageCount")} 
                {selectedCategory !== "Toutes" && ` ${t("gallery.inCategory")} ${selectedCategory}`}
              </p>
            </div>

            {filteredImages?.length === 0 ? (
              <div className="text-center py-16">
                <Images className="h-24 w-24 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">{t("gallery.noImages")}</h3>
                <p className="text-gray-600">
                  {t("gallery.noImagesDescription")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredImages?.map((image, index) => (
                  <Card
                    key={image.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
                    onClick={() => openLightbox(index)}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-black bg-opacity-70 text-white">
                          {image.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {image.alt}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {image.category}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Lightbox */}
        <Lightbox
          images={imageUrls}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </div>
    </div>
  );
}
