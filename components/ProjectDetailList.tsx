import React from 'react'
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PROJECT_DETAILS_BY_PROJECT_QUERY } from '@/sanity/lib/queries';
import { sanityFetch } from '@/sanity/lib/live';
import SimpleCard, { SimpleCardType } from './SimpleCard';

const ProjectDetailList = async ({ post, className }: { post: SimpleCardType, className?: string }) => {

  const { _id: id, title, slug } = post

  const params = { id }

  const { data: searchForProjectDetails } = await sanityFetch({ query: PROJECT_DETAILS_BY_PROJECT_QUERY, params });

  if (!searchForProjectDetails?.length) return null

  return (
    <section className={cn("section_container !justify-items-center !px-2", className)}>
      <Link href={`/du-an/${slug?.current}`} className='flex xl:w-[80rem] lg:w-[65rem] md:w-[43rem] w-full'>
        <h1 className="heading-half hover:underline hover:text-primary w-full" style={{ textAlign: 'left' }}>
          <span className="">{title}</span>
        </h1>
      </Link>
      <ul className={cn("mt-7 card_grid max-7-xl w-full !justify-center", className)}>
        {searchForProjectDetails?.length > 0 && (
          searchForProjectDetails.map((post: SimpleCardType) => (
            <SimpleCard key={post?._id} post={post} path='bai-viet' className='xs:w-full justify-items-center' />
          ))
        )}
      </ul>
    </section>
  )
}
export default ProjectDetailList
