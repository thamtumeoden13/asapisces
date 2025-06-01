import { ContactButton } from "@/components/shared/ContactButton";
import Navbar from "@/components/shared/Navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-n-1">
      <Navbar className="!text-black" containerClassName="!bg-white" />
      {children}
      <ContactButton />
    </div>
  );
}
