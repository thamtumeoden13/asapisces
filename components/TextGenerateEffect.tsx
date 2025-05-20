"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  idxTranfer = 3,
  className,
  link,
}: {
  words: string;
  idxTranfer?: number;
  className?: string;
  link?: string;
}) => {
  const [scope, animate] = useAnimate();
  let wordsArray = words.split(" ");
  useEffect(() => {
    animate(
      "span",
      {
        opacity: 1,
      },
      {
        duration: 2,
        delay: stagger(0.2),
      }
    );
  }, [scope.current]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className={`${idx > idxTranfer ? 'text-primary' : 'text-white'} opacity-0`}
            >
              {word.toString()}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn("font-bold", className)} onClick={() => link && window.open(link,'_blank')}>
      <div className="leading-snug tracking-wide text-white">
        {renderWords()}
      </div>
    </div>
  );
};
