import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ContactButton } from "@/components/shared/ContactButton";

export default function Layout({children}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <main className={"font-ibm-plex"}>
      <Header />
      {children}
      <ContactButton />
      <Footer />
    </main>
  )
}