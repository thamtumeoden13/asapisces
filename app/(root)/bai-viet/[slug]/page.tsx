import React, { Suspense } from "react";
import {
  PROJECT_DETAIL_BY_SLUG_QUERY,
  PROJECT_DETAIL_VIEWS_QUERY,
  PROJECT_DETAILS_BY_TAG,
} from "@/sanity/lib/queries";
import { client } from "@/sanity/lib/client";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import View from "@/components/View";

import SimpleCard, { SimpleCardType } from "@/components/SimpleCard";
import { sanityFetch } from "@/sanity/lib/live";
import MarkupSchema from "@/components/shared/MarkupSchema";
import { CloudinaryImage } from "@/components/shared/CloudinaryImage";
import { overvewTranslate } from "@/constants";
import { ImageGalleryProvider } from "@/components/shared/ImageGalleryContext";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const slug = (await params).slug;

  const { data: post } = await sanityFetch({
    query: PROJECT_DETAIL_BY_SLUG_QUERY,
    params: { slug },
  });

  const releatedPosts =
    (post &&
      (await client.fetch(PROJECT_DETAILS_BY_TAG, {
        tag: post?.tags,
        id: post._id,
      }))) ||
    [];

  console.log(releatedPosts);

  if (!post) return notFound();

  return (
    <>
      <MarkupSchema path={`bai-viet/${slug}`} post={post} />

      <section
        className={
          "pink_container md:!min-h-[28rem] !flex !mt-0 !md:my-0 !pb-4 !pt-24 md:!pt-32 "
        }
      >
        <p className={"tag"}>{formatDate(post?._createdAt)}</p>

        <h1 className={"heading"}>{post.title}</h1>
        <p className={"sub-heading !max-w-5xl"}>{post.description}</p>
      </section>

      {/* <section className={"section_container !py-0 !px-2 !min-h-[230px] !max-w-screen-xl"}>
        <div className="h-[48rem] max-w-screen-xl">
          <ProjectAlbum />
        </div>
      </section> */}

      <section className="section_container !px-2">
        {/* <ProjectGeneral post={post} /> */}
        <CloudinaryImage
          src={post.thumbnail}
          alt={post.subtitle || "Art Sunday"}
          width={760}
          height={540}
          quality={100}
          q_auto={false}
          f_auto={false}
          className="object-cover w-full mb-10 rounded-lg"
        />
        <div className="flex flex-col gap-4 pb-4 border-b border-black-100">
          <ul className="grid items-center justify-center grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
            {post.overview &&
              (
                Object.keys(post.overview) as Array<
                  keyof typeof overvewTranslate
                >
              ).map((key) => {
                if (!post.overview[key]) return null;
                return (
                  <li key={key} className="flex items-center gap-2">
                    <span className="text-[18px]">
                      {overvewTranslate[key]}:
                    </span>
                    <span className="text-20-medium !text-[18px]">
                      {post.overview[key]}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>

        <div className="flex items-start justify-between gap-1">
          <div className={"space-y-5 mt-10 pr-0 md:pr-10 max-w-7xl mx-auto"}>
            <h3 className={"text-30-bold"}>Bài Viết Chi Tiết</h3>
            {/* {parsedContent ? (
              <article
                className={"prose max-w-7xl font-ibm-plex text-justify"}
                dangerouslySetInnerHTML={{ __html: parsedContent }}
              />
            ) : (
              <p className={"no-result"}>Không tìm thấy thông tin phù hợp</p>
            )} */}
            <ImageGalleryProvider>
              <MarkdownRenderer markdown={post?.pitch} />
            </ImageGalleryProvider>
          </div>

          <div className="hidden lg:flex flex-col] mt-4">
            {releatedPosts?.length > 0 && (
              <div className={"flex flex-col items-center"}>
                <p
                  className={
                    "heading-half !leading-[16px] !text-left w-[330px] !bg-black-100 rounded-tl-2xl"
                  }
                >
                  Quan Tâm
                </p>

                <ul className={"mt-2 card_grid-xs !justify-start"}>
                  {releatedPosts.map((post: SimpleCardType) => (
                    <SimpleCard
                      key={post._id}
                      post={post}
                      path="bai-viet"
                      className="xs:w-full justify-items-center"
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <hr className={"divider !max-w-full"} />

        <Suspense fallback={<Skeleton className={"view_skeleton"} />}>
          <View query={PROJECT_DETAIL_VIEWS_QUERY} id={post._id} />
        </Suspense>
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
  const data = await client.fetch(PROJECT_DETAIL_BY_SLUG_QUERY, { slug });

  if (!data) return null;

  return {
    title: `${data.title} - Art Sunday`,
    description: `${data.description}`,
    openGraph: {
      title: `${data?.title} - Art Sunday`,
      description: `${data?.description}`,
      url: `http://artsunday.vn/bai-viet/${slug}`,
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
