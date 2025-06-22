import { auth } from "@/auth";
import CompanionForm from "@/components/companion/CompanionForm";
import { redirect } from "next/navigation";
import React from "react";

const NewCompanion = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  return (
    <section className="min-lg:w-1/3  min-md:w-2/3 items-center justify-center">
      <article className="w-full gap-4 flex flex-col">
        <h1>Companion Builder</h1>

        <CompanionForm />
      </article>
    </section>
  );
};

export default NewCompanion;
