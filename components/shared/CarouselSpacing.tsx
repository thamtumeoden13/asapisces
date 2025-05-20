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
import { FocusCard } from "../ui/focus-cards"
import { cn } from "@/lib/utils"

export type CarouselSpacingDataType = Omit<Project, "author">

export function CarouselSpacing(
  {
    className,
    data,
  }: {
    className?: string;
    data: CarouselSpacingDataType[],
  }
) {
  return (
    <Carousel className={cn("w-full max-w-4xl", className)}>
      <CarouselContent className="-ml-1">
        {data.map((card, index) => (
          <CarouselItem
            key={`carousel-item-card-${card._id}-${index.toString()}`}
            className="pl-1 md:basis-1/2 lg:basis-1/3"
          >
            <FocusCard
              card={card}
              index={index}
              hovered={index}
            // setHovered={setHovered}
            // onClick={handleClick}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
