import { cn, getTechLogos } from "@/lib/utils";
import Image from "next/image";
import React from "react";

const DisplayTechIcons = async ({ techStack }: TechIconProps) => {
  const tectIcons = await getTechLogos(techStack);

  console.log({ tectIcons });
  return (
    <div className="flex flex-row">
      {tectIcons.slice(0, 3).map(({ tech, url }, index) => (
        <div
          key={tech}
          className={cn(
            "relative p-2 rounded-full group bg-dark-300 flex-center",
            index >= 1 && "-ml-3"
          )}
        >
          <span className="tech-tooltip">{tech}</span>
          <Image
            src={url}
            alt={tech}
            width={100}
            height={100}
            className="size-5"
          />
        </div>
      ))}
    </div>
  );
};

export default DisplayTechIcons;
