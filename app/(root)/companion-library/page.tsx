import {
  getAllCompanions,
  getPopularCompanionsAction,
} from "@/lib/actions/companion.actions";
import SearchInput from "@/components/companion/SearchInput";
import SubjectFilter from "@/components/companion/SubjectFilter";
import { CompanionList } from "@/components/companion/CompanionList";

// --- BƯỚC 1: IMPORT CÁC THÀNH PHẦN MỚI ---
import { calculateStreakAction } from "@/lib/actions/session.action"; // Action để tính streak
import { StreakDisplay } from "@/components/companion/StreakDisplay"; // Component UI
import { Card, CardContent } from "@/components/ui/card"; // Để tạo banner đẹp hơn
import { SearchParams } from "@/types";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { QuickFilterTags } from "@/components/companion/QuickFilterTags";

// --- IMPORT CÁC ACTION MỚI ---
import { getMostRecentCompanionAction } from "@/lib/actions/session.action";
import { getNewestCompanionsAction } from "@/lib/actions/companion.actions";
import { CompanionCarousel } from "@/components/companion/CompanionCarousel"; // Component mới
import { ResumeCard } from "@/components/companion/ResumeCard"; // Component mới
import { redirect } from "next/navigation";

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  const userName = user?.name || "learner";

  const filters = await searchParams;
  const subject = filters.subject ? filters.subject : "";
  const topic = filters.topic ? filters.topic : "";

  // --- LẤY DỮ LIỆU TRANG ĐẦU TIÊN TRÊN SERVER ---

  // --- BƯỚC 2: GỌI CẢ HAI SERVER ACTION ---
  // Các lời gọi này sẽ chạy song song để tối ưu hóa tốc độ tải trang
  const [
    initialData,
    streakData,
    mostRecentCompanion,
    popularCompanions,
    newestCompanions,
  ] = await Promise.all([
    getAllCompanions({ page: 1, subject, topic }),
    calculateStreakAction(),
    getMostRecentCompanionAction(),
    getPopularCompanionsAction(5, "week"),
    getNewestCompanionsAction(5),
  ]);

  console.log("initialData:", initialData);

  return (
    <section className="mx-auto px-14 flex flex-col gap-8 bg-background h-full w-full max-w-[1440px] pt-10 max-sm:px-2">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-100">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-6 md:flex-row">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Welcome Back, {userName}!
            </h2>
            <p className="mt-1 text-gray-600">
              {streakData.streak > 0
                ? `Keep up the great work. You're on a ${streakData.streak}-day streak!`
                : "Start a session today to build your practice habit."}
            </p>
          </div>
          <StreakDisplay
            streak={streakData.streak}
            practicedToday={streakData.practicedToday}
          />
        </CardContent>
      </Card>

      {mostRecentCompanion && <ResumeCard companion={mostRecentCompanion} />}

      {popularCompanions.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold text-black-100">
            Popular This Week
          </h2>
          <CompanionCarousel companions={popularCompanions} />
        </div>
      )}

      {newestCompanions.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold text-black-100">
            Newly Added
          </h2>
          <CompanionCarousel companions={newestCompanions} />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between w-full gap-4 max-sm:flex-col">
          <h1 className="text-3xl font-bold text-black-200">
            Companion Library
          </h1>
          <div className="flex items-center gap-4">
            <SearchInput />
            <SubjectFilter />
          </div>
        </div>
        <QuickFilterTags title="Popular topics:" />
      </div>
      <CompanionList
        initialCompanions={initialData.companions}
        initialHasNextPage={initialData.hasNextPage}
        filters={filters}
      />
    </section>
  );
};

export default CompanionsLibrary;
