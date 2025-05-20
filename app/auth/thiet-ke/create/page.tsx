import React from 'react'
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DesignForm from '@/components/DesignForm';

const Page = async () => {
  const session = await auth();

  if (!session) redirect("/");

  return (
    <>
      <section className={"pink_container !min-h-[230px] !mt-0"}>
        <h1 className={"heading"}>TẠO MỚI HẠNG MỤC THIẾT KẾ</h1>
      </section>

      <DesignForm />
    </>
  )
}
export default Page
