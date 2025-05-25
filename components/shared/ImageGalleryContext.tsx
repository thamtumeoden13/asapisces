"use client"

import { createContext, useContext, useState, type ReactNode, useCallback } from "react"
import { ImageGalleryDialog } from "./ImageGalleryDialog"

interface Image {
  src: string
  alt: string
}

interface ImageGalleryContextType {
  images: Image[]
  registerImage: (image: Image) => void
  openGallery: (imageSrc: string) => void
}

const ImageGalleryContext = createContext<ImageGalleryContextType | undefined>(undefined)

export function useImageGallery() {
  const context = useContext(ImageGalleryContext)
  if (!context) {
    throw new Error("useImageGallery must be used within an ImageGalleryProvider")
  }
  return context
}
 
interface ImageGalleryProviderProps {
  children: ReactNode
}

export function ImageGalleryProvider({ children }: ImageGalleryProviderProps) {
  const [images, setImages] = useState<Image[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null)

  const registerImage = useCallback((image: Image) => {
    setImages((prev) => {
      // Check if the image is already registered
      if (prev.some((img) => img.src === image.src)) {
        return prev
      }
      return [...prev, image]
    })
  }, [])

  const openGallery = useCallback((imageSrc: string) => {
    setCurrentImageSrc(imageSrc)
    setIsOpen(true)
  }, [])

  const closeGallery = useCallback(() => {
    setIsOpen(false)
  }, [])

  const value = {
    images,
    registerImage,
    openGallery,
  }

  return (
    <ImageGalleryContext.Provider value={value}>
      {children}
      <ImageGalleryDialog isOpen={isOpen} onClose={closeGallery} images={images} currentImageSrc={currentImageSrc} />
    </ImageGalleryContext.Provider>
  )
}
