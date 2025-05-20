import Navbar from "@/components/Navbar";
import Head from "next/head";

export default function Layout({ children }: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <main className={"font-ibm-plex"}>
      <Head>
        {/* Chặn index cho các trang trong /auth */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      {children}
    </main>
  )
}