import React from "react";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";

export const experimental_ppr = true;

const AuthPage = async () => {
  return (
    <section className={"section_container min-h-[32rem] mt-8 w-full"}>
      <div className="flex flex-col gap-10">
        <form
          action={async () => {
            "use server";
            await signIn("github");
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
        <form
          action={async () => {
            "use server";
            await signIn("google");
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
    </section>
  );
};
export default AuthPage;
