import { useState, useEffect } from "react";
import { Button } from "./button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface LightboxMedia {
  url: string;
  mediaType: "image" | "video" | "youtube" | "vimeo";
  thumbnailUrl?: string;
  title?: string;
}

interface LightboxProps {
  media: LightboxMedia[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function Lightbox({ media, currentIndex, isOpen, onClose }: LightboxProps) {
  const [index, setIndex] = useState(currentIndex);

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        } else if (e.key === "ArrowLeft") {
          goToPrevious();
        } else if (e.key === "ArrowRight") {
          goToNext();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "auto";
      };
    }
  }, [isOpen, index]);

  const goToPrevious = () => {
    setIndex(prev => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const goToNext = () => {
    setIndex(prev => (prev < media.length - 1 ? prev + 1 : 0));
  };

  if (!isOpen || media.length === 0) return null;

  const current = media[index];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lightbox-overlay">
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Previous Button */}
        {media.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            className="absolute left-4 z-10 text-white hover:text-gray-300"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {/* Media content */}
        {current.mediaType === "image" && (
          <img
            src={current.url}
            alt={current.title || ""}
            className="max-w-full max-h-full object-contain"
          />
        )}

        {current.mediaType === "video" && (
          <video
            src={current.url}
            poster={current.thumbnailUrl}
            controls
            preload="metadata"
            className="max-w-full max-h-full"
          />
        )}

        {current.mediaType === "youtube" && (
          <iframe
            src={`${current.url}?autoplay=0&rel=0`}
            title={current.title || "YouTube video"}
            className="max-w-full max-h-full w-full h-full"
            style={{ aspectRatio: "16/9" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}

        {current.mediaType === "vimeo" && (
          <iframe
            src={`${current.url}?autoplay=0`}
            title={current.title || "Vimeo video"}
            className="max-w-full max-h-full w-full h-full"
            style={{ aspectRatio: "16/9" }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}

        {/* Next Button */}
        {media.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            className="absolute right-4 z-10 text-white hover:text-gray-300"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Title + Counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
          {current.title && (
            <p className="text-white bg-black bg-opacity-50 px-4 py-1 rounded-full text-sm mb-1">
              {current.title}
            </p>
          )}
          {media.length > 1 && (
            <span className="text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
              {index + 1} / {media.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

