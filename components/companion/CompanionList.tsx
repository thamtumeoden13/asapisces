// File: components/companion/CompanionList.tsx
"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer"; // Thư viện để tự động load khi cuộn
import { getAllCompanions } from "@/lib/actions/companion.actions";
import CompanionCard from "@/components/companion/CompanionCard";
import { getSubjectColor } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho companion nhận từ action
type Companion = Awaited<ReturnType<typeof getAllCompanions>>["companions"][0];

interface CompanionListProps {
  initialCompanions: Companion[];
  initialHasNextPage: boolean;
  filters: { subject?: string; topic?: string };
}

export function CompanionList({
  initialCompanions,
  initialHasNextPage,
  filters,
}: CompanionListProps) {
  const [companions, setCompanions] = useState<Companion[]>(initialCompanions);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [page, setPage] = useState(2); // Trang tiếp theo cần tải là trang 2
  const [isLoading, setIsLoading] = useState(false);

  // Hook để theo dõi khi người dùng cuộn đến cuối danh sách
  const { ref, inView } = useInView();

  // Reset danh sách khi filter thay đổi
  useEffect(() => {
    setCompanions(initialCompanions);
    setHasNextPage(initialHasNextPage);
    setPage(2);
  }, [initialCompanions, initialHasNextPage]);

  const loadMoreCompanions = async () => {
    if (isLoading || !hasNextPage) return;
    setIsLoading(true);

    const res = await getAllCompanions({ page, ...filters });
    
    setCompanions((prev) => [...prev, ...res.companions]);
    setHasNextPage(res.hasNextPage);
    setPage((prev) => prev + 1);

    setIsLoading(false);
  };
  
  // Tự động gọi `loadMoreCompanions` khi người dùng cuộn đến phần tử `ref`
  useEffect(() => {
    if (inView) {
      loadMoreCompanions();
    }
  }, [inView]);

  return (
    <>
      <div className="companions-grid">
        {companions.map((companion) => (
          <CompanionCard
            key={companion.id}
            {...companion}
            color={getSubjectColor(companion.subject)}
            href={`/companion/conversation`}
          />
        ))}
      </div>
      
      {/* Hiển thị nút "Load More" hoặc spinner */}
      <div ref={ref} className="flex justify-center mt-8">
        {isLoading && <Loader2 className="w-8 h-8 animate-spin" />}
        {!isLoading && !hasNextPage && companions.length > 0 && (
          <p className="text-gray-500">You&apos;ve reached the end!</p>
        )}
      </div>
    </>
  );
}