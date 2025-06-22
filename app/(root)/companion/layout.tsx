import Navbar from "@/components/shared/Navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="bg-n-1 mx-auto px-14 flex flex-col gap-8 min-h-screen pt-24 max-sm:px-2">
      <Navbar
        className="!text-black-400"
        containerClassName="!bg-light border"
      />
      {children}
    </main>
  );
}
