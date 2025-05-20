import React from 'react'
import { auth, signIn, signOut } from "@/auth";
import { LogOut, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { clientNoCache } from '@/sanity/lib/client';
import { AUTHOR_BY_ID_QUERY } from '@/sanity/lib/queries';
import { TabManagement } from '@/components/TabManagement';
import Image from 'next/image';

export const experimental_ppr = true;

const AuthPage = async () => {
  const session = await auth();

  console.log('AuthPage -> session', session)
  let user = null;
  if (session?.id) {
    user = await clientNoCache.fetch(AUTHOR_BY_ID_QUERY, { id: session?.id });
  }

  return (
    <section className={"section_container min-h-[100rem] mt-8 w-full"}>
      {user ? (
        <>
          <div className={"profile_card  my-4 "}>
            <div className={"profile_title"}>
              <h3 className={"text-24-black uppercase text-center line-clamp-1"}>
                {user.name}
              </h3>
            </div>

            <Image
              src={user.image}
              alt={user.name}
              width={220}
              height={220}
              className={"profile_image"}
            />

            <p className={"text-16-medium !text-white-100 mt-7 text-center"}>
              @{user?.username}
            </p>
            <p className={"mt-1 text-center text-14-normal"}>{user?.bio}</p>
          </div>
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/auth" });
          }}
            className=""
          >
            <Button
              type={"submit"}
              className={"startup-form_btn text-white gap-4 !w-80 rounded-full"}
            // disabled={isPending}
            >
              <span>{"Đăng Xuất"}</span>
              <LogOut className={"size-6 text-white"} />
            </Button>
          </form>
          <section className={"section_container !mt-0 !p-0"}>
            <TabManagement user={user} />
          </section>
        </>
      ) : (
        <div className="flex flex-col gap-10">
          <form action={async () => {
            "use server"
            await signIn('github');
          }}
          >
            <Button
              type={"submit"}
              className={"startup-form_btn text-white gap-4"}
            // disabled={isPending}
            >
              {"Đăng Nhập Bằng GitHub"}
              <IconBrandGithub className={"size-12"} />
            </Button>
          </form>
          <form action={async () => {
            "use server"
            await signIn('google');
          }}
          >
            <Button
              type={"submit"}
              className={"startup-form_btn text-white gap-4 bg-secondary"}
            // disabled={isPending}
            >
              {"Đăng Nhập Bằng Google"}
              <IconBrandGoogle className={"size-12"} />
            </Button>
          </form>
        </div>

      )}
    </section>
  )
}
export default AuthPage
