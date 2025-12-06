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
        <div className="flex gap-4 mt-2">
          {companions.map((companion) => (
            <div
              key={companion.id}
              className="relative flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4"
            >
              <CompanionCard
                key={companion.id}
                {...companion}
                color={getSubjectColor(companion.subject)}
                href={`/companion-library/conversation`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Nút điều khiển */}
      <Button
        variant="outline"
        size="icon"
        className="absolute hidden w-10 h-10 -translate-y-1/2 rounded-full top-1/2 -left-4 md:flex bg-slate-300/70"
        onClick={scrollPrev}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute hidden w-10 h-10 -translate-y-1/2 rounded-full top-1/2 -right-4 md:flex bg-slate-300/70"
        onClick={scrollNext}
      >
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
