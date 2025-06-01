"use client";

import React from "react";
import Hero from "@/components/brainwave/Hero";
import Benefits from "@/components/brainwave/Benefits";
import Collaboration from "@/components/brainwave/Collaboration";
import ButtonGradient from "@/components/svg/ButtonGradient";
import Services from "@/components/brainwave/Services";

const page = () => {
  return (
    <>
      <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden">
        <Hero />
        <Benefits />
        <Collaboration />
        <Services />
      </div>
      <ButtonGradient />
    </>
  );
};

export default page;
