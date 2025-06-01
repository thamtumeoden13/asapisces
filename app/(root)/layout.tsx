import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ContactButton } from "@/components/shared/ContactButton";
import Hero from "@/components/Hero";
import About2 from "@/components/About2";
import Navbar from "@/components/shared/Navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className={"font-ibm-plex"}>
      {/* <Header /> */}
      <Navbar />
      {children}
      {/* <ContactButton /> */}
      {/* <Footer /> */}
    </main>
  );
}
