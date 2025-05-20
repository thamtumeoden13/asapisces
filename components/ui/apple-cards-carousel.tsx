"use client";
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import {
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Author, Construction, Project, ProjectDetail } from "@/sanity/types";
import { BlurImage } from "../shared/CloudinaryImage";
import { useRouter } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { PROJECT_DETAILS_BY_PROJECT_QUERY } from "@/sanity/lib/queries";
import { AnimatedTestimonials, Testimonial } from "./animated-testimonials";

interface CarouselProps {
  items: JSX.Element[];
  initialScroll?: number;
}

export type AppleCardType = Omit<ProjectDetail, "author" | "project">
  & { author?: Author }
  & { project?: Project }
  & { content?: React.ReactNode }
  & { path?: string }


export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => { },
  currentIndex: 0,
});

export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -400, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 400, behavior: "smooth" });
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 230 : 384; // (md:w-96)
      const gap = isMobile() ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const isMobile = () => {
    return window && window.innerWidth < 768;
  };

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto py-16 scroll-smooth [scrollbar-width:none]"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div
            className={cn(
              "absolute right-0  z-[1000] h-auto  w-[5%] overflow-hidden bg-gradient-to-l"
            )}
          />

          <div
            className={cn(
              "flex flex-row justify-start gap-4 mx-auto max-w-full md:max-w-[96rem] ",
            )}
          >
            {items.map((item, index) => (
              <motion.div
                // initial={{
                //   opacity: 0,
                //   y: 20,
                // }}
                // animate={{
                //   opacity: 1,
                //   y: 0,
                //   transition: {
                //     duration: 0.5,
                //     delay: 0.2 * index,
                //     ease: "easeOut",
                //     once: true,
                //   },
                // }}
                key={"card" + index}
                className="rounded-xl"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="justify-end hidden gap-2 mb-4 mr-10 lg:flex">
          <button
            className="relative z-40 flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full disabled:opacity-50"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <IconArrowNarrowLeft className="w-6 h-6 text-gray-500" />
          </button>
          <button
            className="relative z-40 flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full disabled:opacity-50"
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <IconArrowNarrowRight className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const AppleCard = ({
  card,
  index,
  layout = false,
  className,
}: {
  card: AppleCardType;
  index: number;
  layout?: boolean;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose, currentIndex } = useContext(CarouselContext);
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cardContent, setCardContent] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useOutsideClick(containerRef, () => handleClose());

  const handleOpen = (card: AppleCardType) => {
    if (card.content) {
      setOpen(true);
      setIsLoading(true);
      getProjectDetails(card)
    } else if (card.path) {
      router.push(`/${card.path}/${card.slug!.current}`)
    }
  };

  const getProjectDetails = async (card: AppleCardType) => {
    const params = { id: card._id }
    const searchForProjects = await client.fetch(PROJECT_DETAILS_BY_PROJECT_QUERY, params);

    console.log(searchForProjects);

    let testimonials_2: Testimonial[] = [{
      name: card.title!,
      designation: card.subtitle!,
      quote: card.description!,
      src: card.thumbnail!,
      path: card.slug?.current,
    }];

    // if (searchForProjects?.length) {
    //   testimonials_2 = searchForProjects.map((post: ProjectDetail) => ({
    //     name: post.title!,
    //     designation: post.subtitle!,
    //     quote: post.description!,
    //     src: post.thumbnail!,
    //     path: post.slug?.current,
    //   }));
    // }

    const path = `/bai-viet/${card.slug?.current}`

    const content = <AnimatedTestimonials testimonials={testimonials_2} path={path} onChange={handleClose} />
    setCardContent(content);
  }

  const handleClose = () => {
    setOpen(false);
    onCardClose(index);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className={cn("fixed inset-0 h-screen z-50 overflow-auto")}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 w-full h-full bg-black/80 backdrop-blur-lg"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={containerRef}
              layoutId={layout ? `card-${card._id}` : undefined}
              className="max-w-5xl mx-auto bg-white dark:bg-neutral-900 h-fit z-[60] my-10 p-4 md:p-10 rounded-3xl font-sans relative"
            >
              <button
                className="sticky right-0 flex items-center justify-center w-8 h-8 ml-auto bg-black rounded-full top-4 dark:bg-white"
                onClick={handleClose}
              >
                <IconX className="w-6 h-6 text-neutral-100 dark:text-neutral-900" />
              </button>
              <motion.p
                layoutId={layout ? `category-${card.title}` : undefined}
                className="text-base font-medium text-primary px-[2rem]"
              >
                {card?.project?.title}
              </motion.p>
              <motion.p
                layoutId={layout ? `title-${card.title}` : undefined}
                className="mt-4 text-2xl font-semibold md:text-3xl text-neutral-700 dark:text-white px-[2rem]"
              >
                {card.title}
              </motion.p>
              {card.content && <AppleCardContent className="p-0">{cardContent}</AppleCardContent>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={() => handleOpen(card)}
        className={cn("rounded-2xl bg-gray-100 dark:bg-neutral-900 h-[28rem] w-[16rem] md:h-[40rem] md:w-[24rem] overflow-hidden flex flex-col items-start justify-start relative z-10", className)}
      >
        <div className="absolute inset-x-0 top-0 z-30 h-full pointer-events-none bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 z-40 p-2 backdrop-blur-sm">
          <motion.p
            layoutId={layout ? `title-${card.title}` : undefined}
            className="text-white text-sm md:text-xl font-semibold max-w-xs text-left [text-wrap:balance] font-sans mt-2"
          >
            {card.title}
          </motion.p>
        </div>
        <BlurImage
          src={card.image!}
          alt={card.title!}
          fill
          loading="eager"
          priority={true}
          className="absolute inset-0 z-10 object-cover"
        />
      </motion.button>
    </>
  );
};

export const AppleCardContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("p-8", className)}>
      {children}
    </div>
  );
}