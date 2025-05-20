import React, { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { clientNoCache } from "@/sanity/lib/client";

import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { AUTHOR_BY_ID_QUERY } from "@/sanity/lib/queries";

import "./admin.css";

const Layout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();
  console.log("AuthPage -> session", session);

  let user = null;
  if (session?.id) {
    user = await clientNoCache.fetch(AUTHOR_BY_ID_QUERY, { id: session?.id });
  }

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
