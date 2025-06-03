import { ContactButton } from "@/components/shared/ContactButton";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/awwwards/Footer";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <Navbar />
      {children}
      <ContactButton />
      <Footer />
    </main>
  );
}
