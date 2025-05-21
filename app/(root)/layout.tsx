import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ContactButton } from "@/components/shared/ContactButton";
import Hero from "@/components/Hero";
import About2 from "@/components/About2";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className={"font-ibm-plex"}>
      <Header />
      <Hero />
      <About2 />
      {children}
      <ContactButton />
      <Footer />
    </main>
  );
}
