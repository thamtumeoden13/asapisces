"use client"

import * as React from "react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Project } from "@/sanity/types"
import Image from "next/image"

export type CarouselOrientationDataType = Omit<Project, "author">

export function CarouselOrientation(
  {
    className,
    data,
  }: {
    className?: string;
    data: CarouselOrientationDataType[],
  }
) {
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      orientation="vertical"
      className="w-full max-w-xs"
    >
      <CarouselContent className="-mt-1 h-[400px]">
        {data.map((card, index) => (
          <CarouselItem
            key={`carousel-item-card-${card._id}-${index.toString()}`}
            className="pt-1 md:basis-1/2"
          >
            <Image
              src={card.image!}
              className="h-48 w-full object-cover object-left-top rounded-lg "
              height="400"
              width="400"
              alt={card.subtitle || "Art Sunday"}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
