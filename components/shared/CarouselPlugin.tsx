"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"

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
import { AppleCard, AppleCardType } from "../ui/apple-cards-carousel"
import { AnimatedTestimonials } from "../ui/animated-testimonials"
import { testimonials_2 } from "@/constants"

export type CarouselPluginDataType = Omit<Project, "author">

export function CarouselPlugin({ data, className }: { data: AppleCardType[], className?: string }) {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  )

  return (
    <Carousel
      plugins={[plugin.current]}
      className={cn("w-full max-w-4xl", className)}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="">
        {data.map((card, index) => (
          <CarouselItem
            key={`carousel-item-card-${card.title}-${index.toString()}`}
            className="last:pr-[5%] rounded-3xl"
          >
            <AppleCard
              key={card._id}
              card={{
                ...card,
                // content: <AnimatedTestimonials testimonials={testimonials_2} />,
                path: "bai-viet"
              }}
              index={index}
              className="lg:h-[72vh] md:h-[60vh]"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
