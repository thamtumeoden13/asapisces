import { getAllCompanions } from "@/lib/actions/companion.actions";
import CompanionCard from "@/components/companion/CompanionCard";
import { getSubjectColor } from "@/lib/utils";
import SearchInput from "@/components/companion/SearchInput";
import SubjectFilter from "@/components/companion/SubjectFilter";

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
  const filters = await searchParams;
  const subject = filters.subject ? filters.subject : "";
  const topic = filters.topic ? filters.topic : "";

  const companions = await getAllCompanions({ subject, topic });

  return (
    <section className="mx-auto px-14 flex flex-col gap-8 bg-background h-full w-full max-w-[1440px] pt-10 max-sm:px-2">
      <div className="flex items-center justify-between gap-4 max-sm:flex-col w-full">
        <h1 className="text-3xl font-bold text-black-200">Companion Library</h1>
        <div className="flex items-center gap-4">
          <SearchInput />
          <SubjectFilter />
        </div>
      </div>
      <div className="companions-grid">
        {companions.map((companion) => (
          <CompanionCard
            key={companion.id}
            {...companion}
            color={getSubjectColor(companion.subject)}
            href="/companion/conversation"
          />
        ))}
      </div>
    </section>
  );
};

export default CompanionsLibrary;
