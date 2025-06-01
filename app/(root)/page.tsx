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
import ProjectDetailList from "@/components/ProjectDetailList";
import Hero from "@/components/Hero";
import About2 from "@/components/About2";
import Story from "@/components/awwwards/Story";
import Features from "@/components/awwwards/Features";
import Contact from "@/components/awwwards/Contact";
import Footer from "@/components/awwwards/Footer";

export default async function Home({
  searchParams,
}: {
  readonly searchParams: Promise<{ query?: string }>;
}) {
  return (
    <>
      <Hero />
      <About2 />
      <Features />
      <Story />
      <Contact />
      <Footer />
    </>
  );
  const query = (await searchParams).query;

  const params = { slugs: ["thi-cong", "thiet-ke"] };

  const { data: searchForProjects } = await sanityFetch({
    query: PROJECT_BY_CONSTRUCTION_SLUGS_QUERY,
    params,
  });

  console.log("searchForProjects", searchForProjects);

  const { select: homeHeroPost } = await client.fetch(CATEGORY_BY_SLUG_QUERY, {
    slug: "danh-muc-trang-chu",
  });

  return (
    <>
      <MarkupSchema post={{}} path="" />
      <section className="section_container !px-0 !pb-0 !max-w-full bg-black-200 justify-items-center !overflow-hidden">
        <AppleCardsCarousel data={homeHeroPost} />
      </section>
      <section className={"pink_container !min-h-[230px] !mt-0 "}>
        <h1 className={"heading"}>Kết Nối Với Chúng Tôi</h1>

        <p className={"sub-heading !max-w-3xl"}>
          Hãy Chọn Hạng Mục Thi Công, Thiết Kế Mà Bạn Quan Tâm.
        </p>

        <SearchForm query={query} path="bai-viet" search="Dự Án" />
      </section>

      <>
        {searchForProjects?.length > 0 &&
          searchForProjects.map((post: SimpleCardType) => (
            <ProjectDetailList key={post?._id} post={post} className="!px-0" />
          ))}
      </>

      <SanityLive />
    </>
  );
}

// export const metadata: Metadata = {
//   title: "CÔNG TY TNHH KIẾN TRÚC XÂY DỰNG ART SUNDAY",
//   description:
//     "Thiết Kế Và Thi Công Kiến Trúc: Nhà Phố, Biệt Thự, Khách Sạn, Nhà Thờ, Nhà Giáo Lý Và Nội Thất Chuyên Nghiệp",
//   keywords: ["Biệt Thự", "Nhà Phố", "Nội Thất", "Công Trình Công Giáo"],
//   openGraph: {
//     title: "Kiến Trúc, Xây Dựng | ART SUNDAY",
//     description:
//       "Thiết Kế Và Thi Công Kiến Trúc: Nhà Phố, Biệt Thự, Khách Sạn, Nhà Thờ, Nhà Giáo Lý Và Nội Thất Chuyên Nghiệp.",
//     url: "https://artsunday.vn/",
//     images: [
//       {
//         url: "https://images.pexels.com/photos/3797991/pexels-photo-3797991.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
//         alt: "noi-that",
//       },
//     ],
//   },
//   twitter: {
//     card: "summary_large_image",
//     site: "@twitterhandle",
//     title: "Kiến Trúc, Xây Dựng | ART SUNDAY",
//     description:
//       "Thiết Kế Và Thi Công Kiến Trúc: Nhà Phố, Biệt Thự, Khách Sạn, Nhà Thờ, Nhà Giáo Lý Và Nội Thất Chuyên Nghiệp.",
//     images: [
//       {
//         url: "https://images.pexels.com/photos/3797991/pexels-photo-3797991.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
//         alt: "noi-that",
//       },
//     ],
//   },
// };
