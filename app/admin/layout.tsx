import React, { ReactNode } from "react";
import { redirect } from "next/navigation";

import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

import "./admin.css";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  return (
    <main className="flex flex-row w-full min-h-screen">
      <Sidebar user={user} />

      <div className="admin-container">
        <Header user={user} />
        {children}
      </div>
    </main>
  );
};

export default Layout;
