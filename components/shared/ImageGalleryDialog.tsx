"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react"

interface Image {
  src: string
  alt: string
}

interface ImageGalleryDialogProps {
  isOpen: boolean
  onClose: () => void
  images: Image[]
  currentImageSrc: string | null
}

export function ImageGalleryDialog({ isOpen, onClose, images, currentImageSrc }: ImageGalleryDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (currentImageSrc) {
      const index = images.findIndex((img) => img.src === currentImageSrc)
      if (index !== -1) {
        setCurrentIndex(index)
      }
    }
    // Reset zoom when changing images
    setZoomLevel(1)
  }, [currentImageSrc, images])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setZoomLevel(1) // Reset zoom
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setZoomLevel(1) // Reset zoom
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      goToNext()
    } else if (e.key === "ArrowLeft") {
      goToPrevious()
    } else if (e.key === "Escape") {
      onClose()
    } else if (e.key === "+") {
      zoomIn()
    } else if (e.key === "-") {
      zoomOut()
    } else if (e.key === "f") {
      toggleFullscreen()
    }
  }

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3))
  }

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const selectImage = (index: number) => {
    setCurrentIndex(index)
    setZoomLevel(1) // Reset zoom
  }

  if (images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[96rem] p-0 bg-black/95 border-none" onKeyDown={handleKeyDown}>
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
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
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
              <div className="overflow-auto max-h-[90vh] max-w-full">
                <img
                  src={currentImage.src || "/placeholder.svg"}
                  alt={currentImage.alt}
                  className="object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "center center",
                  }}
                />
              </div>
              {currentImage.alt && <p className="text-white mt-4 text-center">{currentImage.alt}</p>}
              <p className="text-white/70 text-sm mt-2">
                {currentIndex + 1} / {images.length}
              </p>
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
                    index === currentIndex ? "border-white" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => selectImage(index)}
                >
                  <img src={image.src || "/placeholder.svg"} alt={image.alt} className="h-16 w-auto object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
