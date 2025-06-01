// next-seo.config.ts
const title = "asapisces | Chuyện tình, ký ức và những điều chưa nói";
const description =
  "Một blog cá nhân ghi lại hành trình yêu thương của hai tâm hồn song ngữ. Những ký ức, câu chuyện, và cảm xúc chưa bao giờ được nói thành lời – nhưng luôn hiện diện.";

export const SEO = {
  title,
  description,
  canonical: "https://asapisces.com",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://asapisces.com",
    title,
    description,
    images: [
      {
        url: "https://your-image-hosting.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "asapisces - blog kỷ niệm tình yêu",
      },
    ],
    site_name: "asapisces",
  },
  twitter: {
    handle: "@yourhandle",
    site: "@yourhandle",
    cardType: "summary_large_image",
  },
};
