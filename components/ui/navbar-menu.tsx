"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Link as LinkScroll } from "react-scroll";
import { cn } from "@/lib/utils";

const transition = {
  type: "spring",
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

// eslint-disable-next-line react/prop-types
const NavLink = ({ name, route, isMobile }: { name: string, route?: string, isMobile: boolean }) => {
  if (route) {
    return (
      <Link
        href={route}
        className={
          "max-w-200px base-bold text-p4 uppercase transition-colors duration-500 cursor-pointer hover:text-primary max-lg:my-4 max-lg:h5"
        }
      // onClick={() => setIsOpen(false)}
      >
        {name}
      </Link>
    )
  }
  return (
    <LinkScroll
      to={name}
      offset={-100}
      spy
      smooth
      activeClass={"nav-active"}
      className={
        "base-bold text-p4 uppercase transition-colors duration-500 cursor-pointer hover:text-primary max-lg:my-4 max-lg:h5"
      }
    >
      {name}
    </LinkScroll>
  );
};

export const MenuItem = ({
  setActive,
  active,
  item,
  name,
  route,
  children,
  setIsOpen,
  className,
}: {
  setActive: (item: string | null) => void;
  active: string | null;
  item: string;
  name: string;
  route?: string;
  setIsOpen?: (isOpen: boolean) => void,
  children?: React.ReactNode;
  className?: string;
}) => {

  const [isMobile, setIsMobile] = useState(false);

  const handleEvent = () => {
    console.log("Action triggered for", { item, active, isMobile });
    setActive(item)
    if (isMobile && item !== active) {
      console.log("Action triggered for setIsOpen", isMobile);
      // setIsOpen && setIsOpen(false);
    }
  };


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={!isMobile ? handleEvent : undefined}
      onClick={isMobile ? handleEvent : undefined}
    >
      <motion.p
        transition={{ duration: 0.3 }}
        className="cursor-pointer text-black hover:opacity-[0.9] dark:text-white"
      >
        <NavLink name={name} route={route} isMobile={isMobile} />
      </motion.p>
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {active === item && (
            <div className={cn("absolute top-[calc(100%_+_1.2rem)] left-1/2 transform -translate-x-1/2 pt-4 max-lg:relative", className)}>
              <motion.div
                transition={transition}
                layoutId="active" // layoutId ensures smooth animation
                className="bg-white backdrop-blur-xl max-lg:bg-transparent rounded-2xl overflow-hidden border border-black/[0.2] shadow-xl"
              >
                <motion.div
                  layout // layout ensures smooth animation
                  className="h-full p-4 w-max"
                >
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
}) => {
  return (
    <nav
      onMouseLeave={() => setActive(null)} // resets the state
      className="max-lg:relative max-lg:z-2 max-lg:my-auto"
    >
      {children}
    </nav>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  src,
  setIsOpen
}: {
  title: string;
  description: string;
  href: string;
  src: string;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  return (
    <>
      <Link href={href} className="flex space-x-2 max-lg:hidden">
        <Image
          src={src}
          width={140}
          height={100}
          alt=""
          className="flex-shrink-0 rounded-md shadow-2xl w-[140px] h-[100px]"
        />
        <div>
          <h4 className="mb-1 text-xl font-bold text-black hover:text-primary md:max-w-48">
            {title}
          </h4>
          <p className="text-neutral-700 text-sm max-w-[10rem] hover:text-primary">
            {description}
          </p>
        </div>
      </Link>
      <Link href={href} className="flex space-x-2 lg:hidden" onClick={() => setIsOpen(false)}>
        <h4 className="max-w-sm mb-1 text-xl font-bold text-white hover:text-primary md:max-w-md">
          {title}
        </h4>
      </Link>
    </>
  );
};

export const HoveredLink = ({ children, ...rest }: any) => {
  return (
    <Link
      {...rest}
      className="text-neutral-700 dark:text-neutral-200 hover:text-black "
    >
      {children}
    </Link>
  );
};
