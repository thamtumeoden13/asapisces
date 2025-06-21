import Navbar from "@/components/shared/Navbar";
import type { Metadata } from "next";
import "./companion.css";

export const metadata: Metadata = {
  title: "Converso",
  description: "Real-time AI Teaching Platform",
};
export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-n-1">
      <Navbar className="!text-black" containerClassName="!bg-white" />
      {children}
    </div>
  );
}
