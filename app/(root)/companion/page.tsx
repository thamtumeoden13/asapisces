import { getAllCompanions } from "@/lib/actions/companion.actions";
import CompanionCard from "@/components/companion/CompanionCard";
import { getSubjectColor } from "@/lib/utils";
import SearchInput from "@/components/companion/SearchInput";
import SubjectFilter from "@/components/companion/SubjectFilter";
import { CompanionList } from "@/components/companion/CompanionList";

// --- BƯỚC 1: IMPORT CÁC THÀNH PHẦN MỚI ---
import { calculateStreakAction } from "@/lib/actions/session.action"; // Action để tính streak
import { StreakDisplay } from "@/components/companion/StreakDisplay"; // Component UI
import { Card, CardContent } from "@/components/ui/card"; // Để tạo banner đẹp hơn
import { SearchParams } from "@/types";

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
  const filters = await searchParams;
  const subject = filters.subject ? filters.subject : "";
  const topic = filters.topic ? filters.topic : "";

  // --- LẤY DỮ LIỆU TRANG ĐẦU TIÊN TRÊN SERVER ---

  // --- BƯỚC 2: GỌI CẢ HAI SERVER ACTION ---
  // Các lời gọi này sẽ chạy song song để tối ưu hóa tốc độ tải trang
  const companionsPromise = getAllCompanions({ subject, topic });
  const streakDataPromise = calculateStreakAction();

  // Chờ cả hai hoàn tất
  const [initialData, streakData] = await Promise.all([
    companionsPromise,
    streakDataPromise,
  ]);

  return (
    <section className="mx-auto px-14 flex flex-col gap-8 bg-background h-full w-full max-w-[1440px] pt-10 max-sm:px-2">
      {/* --- BƯỚC 3: THÊM BANNER HIỂN THỊ STREAK --- */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Welcome Back!</h2>
            <p className="text-gray-600 mt-1">
              {streakData.streak > 0
                ? `Keep up the great work. You're on a ${streakData.streak}-day streak!`
                : "Start a session today to build your practice habit."}
            </p>
          </div>
          {/* Truyền dữ liệu vào component StreakDisplay */}
          <StreakDisplay
            streak={streakData.streak}
            practicedToday={streakData.practicedToday}
          />
        </CardContent>
      </Card>
      {/* --- KẾT THÚC BANNER --- */}

      <div className="flex items-center justify-between gap-4 max-sm:flex-col w-full">
        <h1 className="text-3xl font-bold text-black-200">Companion Library</h1>
        <div className="flex items-center gap-4">
          <SearchInput />
          <SubjectFilter />
        </div>
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
