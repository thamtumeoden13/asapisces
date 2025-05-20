import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { NavbarMenu } from "@/components/NavigationMenu";
import { ContactButton } from "@/components/shared/ContactButton";

export default function Layout({children}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <main className={"font-ibm-plex"}>
      {/*<Navbar/>*/}
      {/* <NavbarMenu /> */}
      <Header />
      {children}
      <ContactButton />
      <Footer />
    </main>
  )
}