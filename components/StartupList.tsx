import React from 'react'
import { formatDate } from "@/lib/utils";
import { EyeIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Author, Startup } from "@/sanity/types";
import StartupCard from './StartupCard';
import { PROJECTS_BY_CONSTRUCTION_ID_QUERY, PROJECTS_BY_QUERY } from '@/sanity/lib/queries';
import { sanityFetch } from '@/sanity/lib/live';

export type StartupCardType = Omit<Startup, "author"> & { author?: Author };

const StartupList = async ({ post }: { post: StartupCardType }) => {

  const { _id: id, title } = post

  const params = { id }

  const { data: searchForProjects } = await sanityFetch({ query: PROJECTS_BY_CONSTRUCTION_ID_QUERY, params });

  return (
    <section className={"section_container"}>
      <p className={"text-30-semibold"}>
        {title}
      </p>
      <ul className={"mt-7 card_grid"}>
        {searchForProjects?.length > 0 && (
          searchForProjects.map((post: StartupCardType) => (
            <StartupCard key={post?._id} post={post} path='project' />
          ))
        )}
      </ul>
    </section>
  )
}
export default StartupList
