"use client";

import Hero from "@/components/brainwave/Hero";
import Benefits from "@/components/brainwave/Benefits";
import React from "react";

const page = () => {
  return (
    <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden">
      <Hero />
      <Benefits />
    </div>
  );
};

export default page;
