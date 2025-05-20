import { CONSTRUCTION_BY_SLUG_QUERY, PROJECT_BY_SLUG_QUERY } from "@/sanity/lib/queries";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";
import markdownit from "markdown-it";
import ProjectList from "@/components/ProjectList";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import MarkupSchema from "@/components/shared/MarkupSchema";
import { CloudinaryImage } from "@/components/shared/CloudinaryImage";
import ProjectDetailList from "@/components/ProjectDetailList";

const md = markdownit();

export default async function Constructions({ params }: { readonly params: Promise<{ readonly slug: string }> }) {

  const slug = (await params).slug;


  const { data } = await sanityFetch({ query: PROJECT_BY_SLUG_QUERY, params: { slug } });

  if (!data) return notFound();

  const parsedContent = md.render(data?.pitch || '');

  return (
    <>
      <MarkupSchema post={data} path={`thi-cong/${slug}`} />

      <section className={"pink_container !flex !min-h-[360px] !mt-10 "}>
        <p className={"tag"}>{formatDate(data?._createdAt)}</p>

        <h1 className={"heading"}>{data.title}</h1>
        <p className={"sub-heading !max-w-5xl !text-[18px]"}>{data.description}</p>
      </section>

      <section className={"section_container !px-0 !py-2"}>
        <CloudinaryImage
          src={data.thumbnail}
          alt={data.subtitle || "Art Sunday"}
          width={760}
          height={540}
          className="object-cover w-full rounded-lg md:mb-10"
        />

        <ProjectDetailList key={data?._id} post={data} className="!p-0" />

        <div className={"space-y-5 mt-10 max-w-7xl mx-auto !px-2"}>
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
      <SanityLive />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;

  // Fetch dữ liệu sản phẩm từ API hoặc database
  const { data } = await sanityFetch({ query: CONSTRUCTION_BY_SLUG_QUERY, params: { slug } });

  if (!data) return null;

  return {
    title: `${data.title} - Art Sunday`,
    description: `${data?.description}`,
    openGraph: {
      title: `${data.title} - Art Sunday`,
      description: `${data?.description}`,
      url: `http://artsunday.vn/thi-cong/${slug}`,
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
      card: 'summary_large_image',
      title: `${data?.name} - Art Sunday`,
      description: `${data?.description}`,
      images: [data?.image],
    },
  };
}