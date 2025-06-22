import React from "react";
import CompanionCard from "@/components/companion/CompanionCard";
import CompanionList from "@/components/companion/CompanionList";
import CTA from "@/components/companion/CTA";
import { recentSessions } from "@/constants";
import {
  getAllCompanions,
  getRecentSessions,
} from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";
// import "./companion.css";


const Page = async () => {
  // const companions = await getAllCompanions({ limit: 3 });
  // const recentSessionsCompanions = await getRecentSessions(10);

  // console.log("companions[0]", companions[0]);

  return (
    <main className="mx-auto px-14 flex flex-col gap-8 min-h-screen max-w-[1400px] pt-24 max-sm:px-2">
      <div className="flex flex-col gap-8 max-sm:px-2">
        <h1 className="text-3xl underline text-black-400">Popular Companions</h1>

        <section className="home-section">
          {recentSessions.slice(0, 3).map((companion) => (
            <CompanionCard
              key={companion.id}
              {...companion}
              bookmarked={false}
              color={getSubjectColor(companion.subject)}
            />
          ))}
        </section>

        <section className="home-section">
          <CompanionList
            title="Recently completed sessions"
            companions={recentSessions}
            className="w-2/3 max-lg:w-full"
          />
          <CTA />
        </section>
      </div>
    </main>
  );
};

export default Page;
