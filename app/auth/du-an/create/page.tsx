import React from 'react'
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProjectForm from "@/components/ProjectForm";

const Page = async () => {
  const session = await auth();

  if (!session) redirect("/");

  return (
    <>
      <section className={"pink_container !min-h-[230px] !mt-0"}>
        <h1 className={"heading"}>TẠO MỚI DỰ ÁN</h1>
      </section>

      <ProjectForm />
    </>
  )
}
export default Page
