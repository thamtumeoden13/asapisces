import Head from "next/head";

export default function MarkupSchema({ path, post, }: { path: string, post?: any, }) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post?.title || "Kiến Trúc, Xây Dựng Bình Dương | ART SUNDAY",
    "image": [
      post?.image || "https://images.pexels.com/photos/3797991/pexels-photo-3797991.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      post?.thumbnail || "https://images.pexels.com/photos/3797991/pexels-photo-3797991.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    ],
    "author": {
      "@type": "Person",
      "name": "Vũ Văn Vinh"
    },
    "publisher": {
      "@type": "Organization",
      "name": "CÔNG TY TNHH KIẾN TRÚC XÂY DỰNG ART SUNDAY",
      "logo": {
        "@type": "ImageObject",
        "url": post?.thumbnail || "https://images.pexels.com/photos/3797991/pexels-photo-3797991.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      }
    },
    "datePublished": "2024-12-01",
    "dateModified": "2024-12-08",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://artsunday.vn/${path}`
    },
    "articleBody": post?.subtitle || "Kiến Trúc, Xây Dựng Bình Dương | ART SUNDAY",
    "description": post?.description || "Thiết Kế Và Thi Công Kiến Trúc: Nhà Phố, Biệt Thự, Khách Sạn, Nhà Thờ, Nhà Giáo Lý Và Nội Thất Chuyên Nghiệp"
  }

  return (
    <Head>
      <title>{post?.title || "Kiến Trúc, Xây Dựng Bình Dương | ART SUNDAY"}</title>
      <meta name="description" content={post?.description || "Thiết Kế Và Thi Công Kiến Trúc: Nhà Phố, Biệt Thự, Khách Sạn, Nhà Thờ, Nhà Giáo Lý Và Nội Thất Chuyên Nghiệp."} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
    </Head>
  );
}
