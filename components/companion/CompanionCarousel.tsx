// File: components/companion/CompanionCarousel.tsx
"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanionCard from "@/components/companion/CompanionCard";
import { getSubjectColor } from "@/lib/utils";
import { Companion } from "@/types";

interface CompanionCarouselProps {
  companions: Companion[];
}

export function CompanionCarousel({ companions }: CompanionCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!companions || companions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {companions.map((companion) => (
            <div
              key={companion.id}
              className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 relative"
            >
              <CompanionCard
                key={companion.id}
                {...companion}
                color={getSubjectColor(companion.subject)}
                href={`/companion/conversation/${companion.id}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Nút điều khiển */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 -translate-y-1/2 -left-4 rounded-full h-10 w-10 hidden md:flex"
        onClick={scrollPrev}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-1/2 -translate-y-1/2 -right-4 rounded-full h-10 w-10 hidden md:flex"
        onClick={scrollNext}
      >
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
