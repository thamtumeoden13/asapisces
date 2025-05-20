import React from 'react'
import Link from "next/link";
import { PROJECTS_BY_CONSTRUCTION_ID_QUERY } from '@/sanity/lib/queries';
import { sanityFetch } from '@/sanity/lib/live';
import SimpleCard, { SimpleCardType } from './SimpleCard';
import { cn } from '@/lib/utils';


const ConstructionList = async ({ post, className }: { post: SimpleCardType, className?: string }) => {

  const { _id: id, title, slug } = post

  const params = { id }

  const { data: searchForProjects } = await sanityFetch({ query: PROJECTS_BY_CONSTRUCTION_ID_QUERY, params });

  if (!searchForProjects?.length) return null;

  return (
    <section className={cn("section_container !justify-items-center !px-2", className)}>
      <Link href={`/thi-cong/${slug?.current}`} className='flex lg:w-[65rem] md:w-[43rem] w-full'>
        <h1 className="w-full heading-half hover:underline hover:text-primary" style={{ textAlign: 'left' }}>
          <span className="">{title}</span>
        </h1>
      </Link>
      <ul className={cn("mt-7 card_grid max-7-xl w-full justify-center", className)}>
        {searchForProjects?.length > 0 && (
          searchForProjects.map((post: SimpleCardType) => (
            <SimpleCard key={post?._id} post={post} path='du-an' className='xs:w-full justify-items-center' />
          ))
        )}
      </ul>
    </section>
  )
}
export default ConstructionList
