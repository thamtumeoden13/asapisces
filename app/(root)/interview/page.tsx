import InterviewCard from "@/components/interview/InterviewCard";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewByUserId,
  getLatestInterviewByUserId,
} from "@/lib/actions/general.action";

import Image from "next/image";
import Link from "next/link";
import React from "react";

const Page = async () => {
  const user = await getCurrentUser();

  const [userInterviews, latestInterviews] = await Promise.all([
    await getInterviewByUserId("1bNzrdFkiNXDdJA6YRfe6rJSB2v1"),
    await getLatestInterviewByUserId({ userId: "1bNzrdFkiNXDdJA6YRfe6rJSB2v1" }),
  ]);

  const hasPastInterviews = (userInterviews ?? []).length > 0;
  const hasUpcommingInverviews = (latestInterviews ?? []).length > 0;

  return (
    <div className="flex flex-col gap-12 px-16 mx-auto my-16 max-w-7xl max-sm:px-4 max-sm:my-8">
      <section className="card-cta">
        <div className="flex flex-col max-w-lg gap-6">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practive on real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href={"/interview"}>Start an Interview</Link>
          </Button>
        </div>

        <Image
          src={"/robot.png"}
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interview</h2>

        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard key={interview.id} {...interview} />
            ))
          ) : (
            <p>You haven&apos;t taken any interview yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take an Interview</h2>

        <div className="interviews-section">
          {hasUpcommingInverviews ? (
            latestInterviews?.map((interview) => (
              <InterviewCard key={interview.id} {...interview} />
            ))
          ) : (
            <p>You haven&apos;t taken any interview yet</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Page;
