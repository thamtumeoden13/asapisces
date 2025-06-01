import type { Metadata } from "next";
import "./globals.css";
import "easymde/dist/easymde.min.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics Script */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DXR752DMTX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-DXR752DMTX');
        `}
        </Script>
      </head>
      <body>
        {/* <GoogleAnalytics /> */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "asapisces | Modern Web Developer & AI Agent Explorer",
  description:
    "Trang cá nhân của một lập trình viên hiện đại – nơi giới thiệu sản phẩm, chia sẻ ý tưởng về Web, AI Agent và công nghệ mới.",
  keywords: [
    "modern web developer",
    "AI Agent",
    "asapisces",
    "developer portfolio",
    "software engineer",
    "personal projects",
    "AI product ideas"
  ],
  openGraph: {
    title: "asapisces | Web Dev & AI Ideas",
    description:
      "Sản phẩm cá nhân, demo công nghệ và những ý tưởng về Web & AI Agent – tất cả được viết bởi một lập trình viên hiện đại.",
    url: "https://asapisces.com",
    images: [
      {
        url: "https://your-image-hosting.com/og-modern-dev.jpg",
        alt: "asapisces - modern web developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@yourhandle",
    title: "asapisces | Modern Web Dev Portfolio",
    description:
      "Trang portfolio và ý tưởng AI của một lập trình viên yêu công nghệ hiện đại.",
    images: [
      {
        url: "https://your-image-hosting.com/og-modern-dev.jpg",
        alt: "asapisces - modern dev blog",
      },
    ],
  },
};
