import { auth } from "@/auth";
import { clientNoCache } from "@/sanity/lib/client";
import { AUTHOR_BY_ID_QUERY } from "@/sanity/lib/queries";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

const Layout = async ({ children }: { children: ReactNode }) => {
  const session = await auth();

  console.log("AuthPage -> session", session);
  let user = null;
  if (session?.id) {
    user = await clientNoCache.fetch(AUTHOR_BY_ID_QUERY, { id: session?.id });
  }

  if (user) redirect("/admin");

  return (
    <main className="auth-container">
      <section className="auth-form">
        <div className="auth-box">
          <div className="flex flex-row items-center justify-center gap-3">
            <Image
              src="/images/artsunday.png"
              alt="logo"
              width={64}
              height={64}
            />
            <h1 className="text-2xl font-semibold text-white">Art Sunday</h1>
          </div>

          <div>{children}</div>
        </div>
      </section>

      {/* <section className="auth-illustration">
        <Image
          src="/images/auth-illustration.png"
          alt="image illustrations"
          height={1000}
          width={1000}
          className="object-cover size-full"
        />
      </section> */}
    </main>
  );
};

export default Layout;
