import Navbar from "@/components/shared/Navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-n-1">
      <Navbar className="!text-black-400" containerClassName="!bg-light border" />
      {children}
    </div>
  );
}
