import type { Metadata } from "next";
import SearchForm from "@/components/SearchForm";
import { client } from "@/sanity/lib/client";
import {
  CATEGORY_BY_SLUG_QUERY,
  PROJECT_BY_CONSTRUCTION_SLUGS_QUERY,
} from "@/sanity/lib/queries";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import MarkupSchema from "@/components/shared/MarkupSchema";
import { AppleCardsCarousel } from "@/components/AppleCardsCarousel";
import { SimpleCardType } from "@/components/SimpleCard";
import Hero from "@/components/Hero";
import About from "@/components/awwwards/About";
import Story from "@/components/awwwards/Story";
import Features from "@/components/awwwards/Features";
import Contact from "@/components/awwwards/Contact";

export default async function Home({
  searchParams,
}: {
  readonly searchParams: Promise<{ query?: string }>;
}) {
  return (
    <>
      <Hero />
      <About />
      <Features />
      <Story />
      <Contact />
    </>
  );
}
