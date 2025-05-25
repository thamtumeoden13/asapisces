"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
} from "lucide-react";
import Image from "next/image";

interface Image {
  src: string;
  alt: string;
}

interface ImageGalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  images: Image[];
  currentImageSrc: string | null;
}

interface TouchPosition {
  x: number;
  y: number;
}

export function ImageGalleryDialog({
  isOpen,
  onClose,
  images,
  currentImageSrc,
}: ImageGalleryDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    if (isOpen) {
      toggleFullscreen();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentImageSrc) {
      const index = images.findIndex((img) => img.src === currentImageSrc);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
    // Reset zoom when changing images
    setZoomLevel(1);
    setDragOffset(0);
  }, [currentImageSrc, images]);

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoomLevel(1); // Reset zoom
    setDragOffset(0);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoomLevel(1); // Reset zoom
    setDragOffset(0);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      goToNext();
    } else if (e.key === "ArrowLeft") {
      goToPrevious();
    } else if (e.key === "Escape") {
      handleClose();
    } else if (e.key === "+") {
      zoomIn();
    } else if (e.key === "-") {
      zoomOut();
    } else if (e.key === "f") {
      toggleFullscreen();
    }
  };

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    // Only handle swipes when not zoomed in
    if (zoomLevel > 1) return;

    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || zoomLevel > 1) return;

    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };

    const deltaX = currentTouch.x - touchStart.x;
    const deltaY = Math.abs(currentTouch.y - touchStart.y);

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (deltaY < 100) {
      e.preventDefault();
      setDragOffset(deltaX);
      setTouchEnd(currentTouch);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || zoomLevel > 1) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchStart.x - touchEnd.x;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    } else {
      // Snap back to original position
      setDragOffset(0);
    }

    setIsDragging(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const selectImage = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setZoomLevel(1); // Reset zoom
    setDragOffset(0);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleClose = () => {
    setZoomLevel(1); // Reset zoom when closing
    // Exit fullscreen if in fullscreen mode
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
    onClose();
  };

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-screen w-screen h-screen p-0 bg-black/95 border-none"
        onKeyDown={handleKeyDown}
      >
        <div className="relative flex flex-col items-center justify-center min-h-[80vh]">
          <div className="absolute top-2 right-2 flex space-x-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={zoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={zoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            {/* <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button> */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleClose}
              title="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-center w-full h-full p-4 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 text-white hover:bg-white/20 z-10"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <div className="flex flex-col items-center">
              <div
                ref={imageContainerRef}
                className="overflow-auto max-h-[90vh] max-w-full"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div
                  className={`transition-transform duration-300 ease-out ${isDragging ? "duration-0" : ""}`}
                  style={{
                    transform: `translateX(${dragOffset}px)`,
                  }}
                >
                  <img
                    src={currentImage.src || "/placeholder.svg"}
                    alt={currentImage.alt}
                    className="object-contain transition-transform duration-200 select-none  max-h-[90vh]"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "center center",
                    }}
                    draggable={false}
                  />
                </div>
              </div>
              {currentImage.alt && (
                <p className="text-white mt-4 text-center">
                  {currentImage.alt}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-white/70 text-sm">
                  {currentIndex + 1} / {images.length}
                </p>
                {zoomLevel > 1 && (
                  <p className="text-white/70 text-sm">
                    Zoom: {Math.round(zoomLevel * 100)}%
                  </p>
                )}
              </div>
              {/* Swipe indicator */}
              {isDragging && Math.abs(dragOffset) > 20 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white px-4 py-2 rounded-lg">
                  {dragOffset > 0 ? "← Previous" : "Next →"}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 text-white hover:bg-white/20 z-10"
              onClick={goToNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>

          {/* Thumbnails */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center overflow-x-auto py-2 px-4">
            <div className="flex space-x-2">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`cursor-pointer border-2 transition-all ${
                    index === currentIndex
                      ? "border-white"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => selectImage(index)}
                >
                  <img
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    className="h-16 w-auto object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Swipe instruction for first-time users */}
          {/* {!isDragging && zoomLevel === 1 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/50 text-sm animate-pulse">
              Swipe left/right to navigate
            </div>
          )} */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
