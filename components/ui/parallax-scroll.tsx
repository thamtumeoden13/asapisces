"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, useScroll, useTransform, motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { ProjectDetail } from "@/sanity/types";

type CardType = Omit<ProjectDetail, "author">;

export const ParallaxScroll = ({
  cards,
  className,
  path,
}: {
  cards: CardType[];
  className?: string;
  path?: string;
}) => {
  const [active, setActive] = useState<(typeof cards)[number] | boolean | null>(
    null
  );
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 640); // Kiểm tra nếu màn hình <= 640px
    };

    handleResize(); // Gọi lần đầu tiên khi component mount
    window.addEventListener("resize", handleResize); // Lắng nghe thay đổi kích thước màn hình

    return () => {
      window.removeEventListener("resize", handleResize); // Dọn dẹp sự kiện
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  const gridRef = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    container: gridRef, // remove this if your container is not fixed height
    offset: ["start start", "end start"], // remove this if your container is not fixed height
  });

  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const third = Math.ceil(cards.length / 3);

  const firstPart = cards.slice(0, third);
  const secondPart = cards.slice(third, 2 * third);
  const thirdPart = cards.slice(2 * third);

  return (
    <>

      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 w-full h-full bg-black/20"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0  grid place-items-center z-[100]">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.05,
                },
              }}
              className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full top-2 right-2 lg:hidden"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[500px]  h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden"
            >
              <motion.div layoutId={`image-${active.title}-${id}`}>
                <Image
                  priority
                  width={280}
                  height={200}
                  src={active.thumbnail!}
                  alt=""
                  className="object-cover w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg"
                />
              </motion.div>
              <div>
                <div className="flex items-start justify-between p-4">
                  <div className="">
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="text-base font-medium text-neutral-700 dark:text-neutral-200"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className="text-base text-neutral-600 dark:text-neutral-400"
                    >
                      {active.subtitle}
                    </motion.p>
                  </div>

                  <motion.a
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    href={`${path}/${active.slug?.current}`}
                    className="px-4 py-3 text-sm font-bold text-white bg-green-500 rounded-full"
                  >
                    {"Xem chi tiết"}
                  </motion.a>
                </div>
                <div className="relative px-4 pt-4">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-neutral-600 text-xs md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-start gap-4 overflow-auto dark:text-neutral-400 [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
                  >
                    {active.description}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <div
        className={cn("h-[40rem] items-start overflow-y-auto w-full", className)}
        ref={gridRef}
      >
        <div
          className="grid items-center grid-cols-1 gap-10 px-10 mx-auto md:grid-cols-2 lg:grid-cols-3 max-w-7xl"
          ref={gridRef}
        >
          <div className="grid gap-10">
            {firstPart.map((el, idx) => (
              <motion.div
                className="justify-items-center hover:cursor-pointer"
                style={{ y: isSmallScreen ? 0 : translateFirst }} // Apply the translateY motion value here
                key={"grid-1" + idx}
                onClick={() => setActive(el)}
              >
                <Image
                  src={el.image!}
                  className="h-[414px] w-full object-cover object-left-top rounded-lg gap-5 !m-0 !p-0"
                  height="400"
                  width="400"
                  alt={el.subtitle ?? "Art Sunday"}
                />
              </motion.div>
            ))}
          </div>
          <div className="grid gap-10">
            {secondPart.map((el, idx) => (
              <motion.div
                className="justify-items-center hover:cursor-pointer"
                style={{ y: isSmallScreen ? 0 : translateSecond }}
                key={"grid-2" + idx}
                onClick={() => setActive(el)}
              >
                <Image
                  src={el.image!}
                  className="h-[414px] w-full object-cover object-left-top rounded-lg gap-10 !m-0 !p-0"
                  height="400"
                  width="400"
                  alt={el.subtitle ?? "Art Sunday"}
                />
              </motion.div>
            ))}
          </div>
          <div className="grid gap-10">
            {thirdPart.map((el, idx) => (
              <motion.div
                className="justify-items-center hover:cursor-pointer"
                style={{ y: isSmallScreen ? 0 : translateThird }}
                key={"grid-3" + idx}
                onClick={() => setActive(el)}
              >
                <Image
                  src={el.image!}
                  className="h-[414px] w-full object-cover object-left-top rounded-lg gap-10 !m-0 !p-0"
                  height="400"
                  width="400"
                  alt={el.subtitle ?? "Art Sunday"}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};
