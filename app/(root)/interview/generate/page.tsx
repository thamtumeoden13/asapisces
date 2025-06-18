import Agent from "@/components/interview/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import React from "react";

const Page = async () => {
  const user = await getCurrentUser();

  if(!user) redirect('/sign-in')

  return (
    <div className="flex flex-col gap-12 px-16 mx-auto my-16 max-w-7xl max-sm:px-4 max-sm:my-8 min-h-screen">
      <h3>Interview Generation</h3>

      <Agent userName={user.name!} userId={user.id} type="generate" />
    </div>
  );
};

export default Page;
