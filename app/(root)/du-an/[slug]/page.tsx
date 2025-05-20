import React from "react";
import { PROJECT_BY_SLUG_QUERY } from "@/sanity/lib/queries";
import { client } from "@/sanity/lib/client";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";

import markdownit from "markdown-it";
import ProjectDetailList from "@/components/ProjectDetailList";
import { sanityFetch } from "@/sanity/lib/live";
import MarkupSchema from "@/components/shared/MarkupSchema";
import { CloudinaryImage } from "@/components/shared/CloudinaryImage";

const md = markdownit();

export const experimental_ppr = true;

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const slug = (await params).slug;

  const { data } = await sanityFetch({
    query: PROJECT_BY_SLUG_QUERY,
    params: { slug },
  });

  if (!data) return notFound();

  const parsedContent = md.render(data?.pitch || "");

  return (
    <>
      <MarkupSchema path={`du-an/${slug}`} post={data} />

      <section className={"pink_container !min-h-[360px] !mt-10 "}>
        <p className={"tag"}>{formatDate(data?._createdAt)}</p>

        <h1 className={"heading"}>{data.title}</h1>
        <p className={"sub-heading !max-w-5xl"}>{data.description}</p>
      </section>

      <section className={"section_container max-sm:mt-8"}>
        <CloudinaryImage
          src={data.thumbnail}
          alt={data.subtitle || "Art Sunday"}
          width={760}
          height={540}
          className="object-cover w-full mb-10 rounded-lg"
        />

        <ProjectDetailList key={data?._id} post={data} className="!px-0 " />

        <div className={"space-y-5 mt-10 max-w-7xl mx-auto"}>
          <h3 className={"text-30-bold"}>Bài Viết Chi Tiết</h3>
          {parsedContent ? (
            <article
              className={"prose max-w-7xl font-ibm-plex text-justify"}
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          ) : (
            <p className={"no-result"}>Không tìm thấy thông tin phù hợp</p>
          )}
        </div>

        <hr className={"divider"} />
      </section>
    </>
  );
};
export default Page;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  // Fetch dữ liệu sản phẩm từ API hoặc database
  const data = await client.fetch(PROJECT_BY_SLUG_QUERY, { slug });

  if (!data) return null;

  return {
    title: `${data.title} - Art Sunday`,
    description: `${data.description}`,
    openGraph: {
      title: `${data?.title} - Art Sunday`,
      description: `${data.description}`,
      url: `http://artsunday.vn/du-an/${slug}`,
      images: [
        {
          url: data.image,
          width: 800,
          height: 600,
          alt: data.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.name} - Art Sunday`,
      description: `${data.description}`,
      images: [data.image],
    },
  };
}
