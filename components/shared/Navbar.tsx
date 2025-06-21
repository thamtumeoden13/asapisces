"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowScroll } from "react-use";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Awwwards", route: "/" },
  { name: "Brainwave", route: "/brainwave" },
  { name: "PrepWise", route: "/interview" },
  { name: "Companion", route: "/companion" },
  { name: "Portfolio", route: "/portfolio" },
  { name: "Contact", route: "/portfolio/contact" },
];

const Navbar = ({
  containerClassName,
  className,
}: {
  containerClassName?: string;
  className?: string;
}) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIndicatorActive, setIsIndicatorActive] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);

  const navContainerRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  const { y: currenScrollY } = useWindowScroll();

  const toggleAudioIndicator = () => {
    setIsAudioPlaying((prev) => !prev);

    setIsIndicatorActive((prev) => !prev);
  };

  useEffect(() => {
    if (currenScrollY === 0) {
      setIsNavVisible(true);
      navContainerRef.current?.classList.remove("floating-nav");
    } else if (currenScrollY > lastScrollY) {
      setIsNavVisible(false);
      navContainerRef.current?.classList.add("floating-nav");
    } else if (currenScrollY < lastScrollY) {
      setIsNavVisible(true);
      navContainerRef.current?.classList.add("floating-nav");
    }

    setLastScrollY(currenScrollY);
  }, [currenScrollY, lastScrollY]);

  useEffect(() => {
    gsap.to(navContainerRef.current, {
      y: isNavVisible ? 0 : -100,
      opacity: isNavVisible ? 1 : 0,
      duration: 0.2,
    });
  }, [isNavVisible]);

  useEffect(() => {
    if (isAudioPlaying) {
      audioElementRef.current?.play();
    } else {
      audioElementRef.current?.pause();
    }
  }, [isAudioPlaying]);

  return (
    <div
      ref={navContainerRef}
      className={cn(
        "fixed inset-x-0 z-50 h-16 transition-all duration-700 border-none top-4 sm:inset-x-6",
        containerClassName
      )}
    >
      <header className="absolute w-full -translate-y-1/2 top-1/2">
        <nav className="flex items-center justify-between p-4 size-full">
          <div className="flex items-center gap-7">
            <Link
              href="/"
              className={
                "flex items-center gap-2 text-2xl font-bold text-white"
              }
            >
              <Image
                src="/img/logo.png"
                alt="logo"
                width={40}
                height={40}
                className="w-10"
              />
            </Link>
          </div>

          <div className="flex items-center h-full">
            <div className="hidden md:block">
              {navItems.map((item) => {
                if (item.route) {
                  return (
                    <Link
                      href={item.route}
                      key={item.name}
                      className={cn("nav-hover-btn", className)}
                    >
                      {item.name}
                    </Link>
                  );
                }
                return (
                  <a
                    key={item.name}
                    href={`#${item.name.toLowerCase()}`}
                    className={cn("nav-hover-btn", className)}
                  >
                    {item.name}
                  </a>
                );
              })}
            </div>

            <button
              className="ml-10 flex items-center space-x-0.5"
              onClick={toggleAudioIndicator}
            >
              <audio
                ref={audioElementRef}
                src="/audio/loop.mp3"
                className="hidden"
                loop
              />
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`indicator-line ${isIndicatorActive ? "active" : ""}`}
                  style={{
                    animationDelay: `${bar * 0.1}`,
                  }}
                />
              ))}
            </button>
          </div>
        </nav>
      </header>
    </div>
  );
};

export default Navbar;
