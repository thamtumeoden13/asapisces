"use client"

import React, { MouseEventHandler } from "react";
import clsx, { ClassValue } from "clsx";
import Marker from "./Marker";
import { Element, Link as LinkScroll } from "react-scroll";

const Button = (
  {
    icon,
    children,
    href,
    containerClassName,
    markerFill,
    to,
    onClick,
  }:
    {
      icon: string;
      children: React.ReactNode;
      href?: string;
      containerClassName?: ClassValue,
      markerFill?: string,
      to?: string,
      onClick?: MouseEventHandler<HTMLButtonElement>,
    }
) => {
  const Inner = ({ to = "" }: { to?: string }) => (
    <LinkScroll to={to} offset={-100} spy={true} smooth={true}>
      <span
        className={
          "relative flex items-center min-h-[60px] px-4 g4 rounded-2xl inner-before group-hover:before:opacity-100 overflow-hidden"
        }
      >
        <span className={"absolute -left-[1px]"}>
          <Marker fill={markerFill} />
        </span>
        {icon && (
          <img
            src={icon}
            alt="circle"
            className={"size-10 mr-5 object-contain z-10"}
          />
        )}
        <span
          className={"relative z-2 font-poppins base-bold text-p1 uppercase"}
        >
          {children}
        </span>
      </span>

      <span className={"glow-before glow-after"} />
    </LinkScroll>
  );

  return href ? (
    <a
      className={clsx(
        "relative p-0.5 g5 rounded-2xl shadow-500 group",
        containerClassName,
      )}
      href={href}
    >
      <Inner />
    </a>
  ) : (
    <button
      className={clsx(
        "relative p-0.5 g5 rounded-2xl shadow-500 group",
        containerClassName,
      )}
      onClick={onClick}
    >
      <Inner to={to} />
    </button>
  );
};
export default Button;
