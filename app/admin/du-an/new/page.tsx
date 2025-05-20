import { auth } from "@/auth";
import ProjectForm from "@/components/ProjectForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

const Page = async () => {
  const session = await auth();

  if (!session) redirect("/admin");

  return (
    <section className="w-full bg-white rounded-2xl p-7">
      <div className="w-full mx-auto p-6 min-h-screen">
        <Link
          href="/admin/du-an"
          className="flex items-center text-gray-700 mb-6 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Go back</span>
        </Link>

        <ProjectForm />
      </div>
    </section>
  );
};

export default Page;
