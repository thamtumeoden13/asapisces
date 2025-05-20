import React from 'react'
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProjectForm from "@/components/ProjectForm";
import { client, clientNoCache } from '@/sanity/lib/client';
import { PROJECT_BY_SLUG_QUERY } from '@/sanity/lib/queries';


const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const session = await auth();

  if (!session) redirect("/");
  
  const slug = (await params).slug;

  const post = await clientNoCache.fetch(PROJECT_BY_SLUG_QUERY, { slug })

  if (!post) return redirect("/auth");


  return (
    <>
      <section className={"pink_container !min-h-[230px] !mt-0"}>
        <h1 className={"heading"}>CẬP NHẬT DỰ ÁN</h1>
      </section>

      <ProjectForm post={post} />
    </>
  )
}
export default Page
