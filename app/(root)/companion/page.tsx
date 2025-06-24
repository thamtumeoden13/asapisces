import React from "react";
import CompanionCard from "@/components/companion/CompanionCard";
import CompanionList from "@/components/companion/CompanionList";
import CTA from "@/components/companion/CTA";
import {
  getAllCompanions,
  getRecentSessions,
} from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";
// import "./companion.css";

const Page = async () => {
  const companions = await getAllCompanions({ limit: 3 });
  const recentSessionsCompanions = await getRecentSessions(10);
  return (
    <div className="mx-auto px-14 flex flex-col gap-8 bg-background h-full max-w-[1400px] py-10 max-sm:px-2">
      <h1 className="text-3xl underline text-black-400">Popular Companions</h1>

      <section className="home-section">
        {companions.map((companion) => (
          <CompanionCard
            key={companion.id}
            {...companion}
            color={getSubjectColor(companion.subject)}
          />
        ))}
      </section>

      <section className="home-section">
        <CompanionList
          title="Recently completed sessions"
          companions={recentSessionsCompanions}
          className="w-2/3 max-lg:w-full"
        />
        <CTA />
      </section>
    </div>
  );
};

export default Page;
