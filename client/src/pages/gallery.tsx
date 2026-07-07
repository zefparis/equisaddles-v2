import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { GalleryImage } from "@shared/schema";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import Lightbox, { type LightboxMedia } from "../components/ui/lightbox";
import { Images, Filter, Play, Video, Youtube } from "lucide-react";

const categories = ["Toutes", "Obstacle", "Dressage", "Cross", "Mixte", "Poney", "Autres"];

export default function Gallery() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [selectedMediaType, setSelectedMediaType] = useState("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    scrollToTop();
  }, []);

  const { data: media, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery", "active"],
    queryFn: async () => {
      const res = await fetch("/api/gallery?active=true");
      if (!res.ok) throw new Error("Failed to fetch gallery");
      return res.json();
    },
  });

  const filteredMedia = useMemo(() => {
    if (!media) return [];
    let result = media.filter((m) => m.active !== false);

    if (selectedCategory !== "Toutes") {
      result = result.filter((m) => m.category === selectedCategory);
    }
    if (selectedMediaType !== "all") {
      result = result.filter((m) => m.mediaType === selectedMediaType);
    }

    // Sort by sort_order, featured first
    result.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    return result;
  }, [media, selectedCategory, selectedMediaType]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxMedia: LightboxMedia[] = filteredMedia.map((m) => ({
    url: m.url,
    mediaType: (m.mediaType || "image") as "image" | "video" | "youtube" | "vimeo",
    thumbnailUrl: m.thumbnailUrl || undefined,
    title: m.title || m.alt || undefined,
  }));

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
        <div className="mb-4">
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

        {/* Media Type Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedMediaType === "all" ? "default" : "outline"}
              onClick={() => setSelectedMediaType("all")}
              size="sm"
              className="mb-2"
            >
              Tous
            </Button>
            <Button
              variant={selectedMediaType === "image" ? "default" : "outline"}
              onClick={() => setSelectedMediaType("image")}
              size="sm"
              className="mb-2"
            >
              <Images className="h-4 w-4 mr-1" />
              Photos
            </Button>
            <Button
              variant={selectedMediaType === "video" ? "default" : "outline"}
              onClick={() => setSelectedMediaType("video")}
              size="sm"
              className="mb-2"
            >
              <Video className="h-4 w-4 mr-1" />
              Vidéos
            </Button>
            <Button
              variant={selectedMediaType === "youtube" ? "default" : "outline"}
              onClick={() => setSelectedMediaType("youtube")}
              size="sm"
              className="mb-2"
            >
              <Youtube className="h-4 w-4 mr-1" />
              YouTube
            </Button>
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
                {filteredMedia.length} {filteredMedia.length !== 1 ? "médias" : "média"}
                {selectedCategory !== "Toutes" && ` dans ${selectedCategory}`}
              </p>
            </div>

            {filteredMedia.length === 0 ? (
              <div className="text-center py-16">
                <Images className="h-24 w-24 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">{t("gallery.noImages")}</h3>
                <p className="text-gray-600">
                  {t("gallery.noImagesDescription")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMedia.map((item, index) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
                    onClick={() => openLightbox(index)}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title || item.alt || ""}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Play overlay for videos */}
                      {(item.mediaType === "video" || item.mediaType === "youtube" || item.mediaType === "vimeo") && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black bg-opacity-50 rounded-full p-3">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      )}
                      {/* Media type badge */}
                      {(item.mediaType === "video" || item.mediaType === "youtube" || item.mediaType === "vimeo") && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-black bg-opacity-70 text-white">
                            {item.mediaType === "youtube" ? <Youtube className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                            <span className="capitalize">{item.mediaType}</span>
                          </Badge>
                        </div>
                      )}
                      {/* Category badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-black bg-opacity-70 text-white">
                          {item.category}
                        </Badge>
                      </div>
                      {/* Featured star */}
                      {item.featured && (
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-yellow-500 text-white">
                            ★ Vedette
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {item.title || item.alt || "Sans titre"}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Lightbox */}
        <Lightbox
          media={lightboxMedia}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </div>
    </div>
  );
}

