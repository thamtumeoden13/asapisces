// app/dashboard/loading.tsx

import { WelcomeBannerSkeleton } from "@/components/companion/WelcomeBannerSkeleton";
import { ContinueSessionSkeleton } from "@/components/companion/ContinueSessionSkeleton";
import { PopularSectionSkeleton } from "@/components/companion/PopularSectionSkeleton";

export default function DashboardSkeleton() {
  return (
    // Thêm animate-pulse vào container chính để tất cả các skeleton "nhấp nháy" đồng bộ
    <div className="max-w-[1440px] w-full p-6 space-y-10 animate-pulse">
      <WelcomeBannerSkeleton />
      <ContinueSessionSkeleton />
      <PopularSectionSkeleton />
    </div>
  );
}

export { DashboardSkeleton };
