"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BlurImage, CloudinaryImage } from "../shared/CloudinaryImage";
import Link from "next/link";

export type Testimonial = {
  name: string;
  designation: string;
  quote: string;
  src: string;
  path?: string;
};
export const AnimatedTestimonials = ({
  testimonials,
  autoplay = false,
  path,
  onChange,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
  path?: string;
  onChange?: () => void;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 21) - 10;
  };
  return (
    <div className="max-w-sm p-4 mx-auto font-sans antialiased md:max-w-4xl ">
      <div className="relative grid grid-cols-1">
        <div className="relative w-full">
          <AnimatePresence>
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.src}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  z: -100,
                  rotate: randomRotateY(),
                }}
                animate={{
                  opacity: isActive(index) ? 1 : 0.7,
                  scale: isActive(index) ? 1 : 0.95,
                  z: isActive(index) ? 0 : -100,
                  rotate: isActive(index) ? 0 : randomRotateY(),
                  zIndex: isActive(index)
                    ? 999
                    : testimonials.length + 2 - index,
                  y: isActive(index) ? [0, -80, 0] : 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  z: 100,
                  rotate: randomRotateY(),
                }}
                transition={{
                  duration: 0.4,
                  ease: "easeInOut",
                }}
                className="inset-0 origin-bottom "
              >
                <CloudinaryImage
                  src={testimonial.src}
                  alt={testimonial.name}
                  width={760}
                  height={540}
                  className="object-cover w-full mb-4 rounded-lg"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex flex-col justify-between py-4">
          <motion.div
            key={active}
            initial={{
              y: 20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: -20,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <h3 className="text-2xl font-bold text-black dark:text-white">
              {testimonials[active].name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-500">
              {testimonials[active].designation}
            </p>
            <motion.p className="mt-8 text-lg text-gray-500 dark:text-neutral-300">
              {testimonials[active].quote.split(" ").map((word, index) => (
                <motion.span
                  key={index + word}
                  initial={{
                    filter: "blur(10px)",
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    filter: "blur(0px)",
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                    delay: 0.02 * index,
                  }}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
          </motion.div>
          {path && <div className="flex pt-4">
            <Link href={path} onClick={() => setTimeout(() => {
              onChange && onChange();
            }, 1000)} className='flex xl:w-[80rem] lg:w-[65rem] md:w-[43rem] w-full'>
              <motion.p
                className="w-full text-2xl font-medium text-p1 px-[2rem] text-right hover:text-primary"
              >
                {"Xem thêm"}
              </motion.p>
            </Link>
          </div>}
          {/* <div className="flex gap-4 pt-12 md:pt-0">
            <button
              onClick={handlePrev}
              className="flex items-center justify-center bg-gray-100 rounded-full h-7 w-7 dark:bg-neutral-800 group/button"
            >
              <IconArrowLeft className="w-5 h-5 text-black transition-transform duration-300 dark:text-neutral-400 group-hover/button:rotate-12" />
            </button>
            <button
              onClick={handleNext}
              className="flex items-center justify-center bg-gray-100 rounded-full h-7 w-7 dark:bg-neutral-800 group/button"
            >
              <IconArrowRight className="w-5 h-5 text-black transition-transform duration-300 dark:text-neutral-400 group-hover/button:-rotate-12" />
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};
