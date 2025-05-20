import { auth } from "@/auth";
import ProjectDetailForm from "@/components/ProjectDetailForm";
import { clientNoCache } from "@/sanity/lib/client";
import { PROJECT_DETAIL_BY_SLUG_QUERY } from "@/sanity/lib/queries";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const session = await auth();

  if (!session) redirect("/admin");

  const slug = (await params).slug;

  const post = await clientNoCache.fetch(PROJECT_DETAIL_BY_SLUG_QUERY, {
    slug,
  });

  if (!post) return redirect("/admin/bai-viet");

  return (
    <section className="w-full bg-white rounded-2xl p-7">
      <div className="w-full mx-auto p-6 min-h-screen">
        <Link
          href="/admin/bai-viet"
          className="flex items-center text-gray-700 mb-6 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Go back</span>
        </Link>

        <ProjectDetailForm post={post} />
      </div>
    </section>
  );
};

export default Page;
