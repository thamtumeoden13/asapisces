import Agent from "@/components/interview/Agent";
import DisplayTechIcons from "@/components/interview/DisplayTechIcons";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewById } from "@/lib/actions/general.action";
import { getRandomInterviewCover } from "@/lib/utils";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";

const Page = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  if(!user) redirect("/sign-in")

  const interview = await getInterviewById(id);

  if (!interview) redirect("/interview");

  return (
    <div className="flex flex-col gap-12 px-16 mx-auto my-16 max-w-7xl max-sm:px-4 max-sm:my-8 min-h-screen">
      <div className="flex flex-row justify-between gap-4">
        <div className="flex flex-row items-center gap-4 max-sm:flex-col">
          <div className="flex flex-row items-center gap-4">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />

            <h3 className="capitalize ">{interview.role}</h3>
          </div>

          <DisplayTechIcons techStack={interview.techstack} />
        </div>

        <p className="px-4 py-2 capitalize rounded-lg bg-dark-200 h-fit">
          {interview.type}
        </p>
      </div>

      <Agent
        userName={user.name}
        userId={user.id}
        interviewId={id}
        type="interview"
        questions={interview.questions}
      />
    </div>
  );
};

export default Page;
