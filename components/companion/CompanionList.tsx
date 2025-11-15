// File: components/companion/CompanionList.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useInView } from "react-intersection-observer"; // Thư viện để tự động load khi cuộn
import { getAllCompanions } from "@/lib/actions/companion.actions";
import CompanionCard from "@/components/companion/CompanionCard";
import { getSubjectColor } from "@/lib/utils";

import { CompanionCardSkeleton } from "./CompanionCardSkeleton";
import { Companion } from "@/types";

// Định nghĩa kiểu dữ liệu cho companion nhận từ action

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
  // const [isLoading, setIsLoading] = useState(false);
  const [isLoading, startTransition] = useTransition();

  // Hook để theo dõi khi người dùng cuộn đến cuối danh sách
  const { ref, inView } = useInView();

  // Reset danh sách khi filter thay đổi
  useEffect(() => {
    setCompanions(initialCompanions);
    setHasNextPage(initialHasNextPage);
    setPage(2);
  }, [initialCompanions, initialHasNextPage]);

  const loadMoreCompanions = () => {
    if (isLoading || !hasNextPage) return;

    startTransition(async () => {
      const res = await getAllCompanions({ page, ...filters });
      setCompanions((prev) => [...prev, ...res.companions]);
      setHasNextPage(res.hasNextPage);
      setPage((prev) => prev + 1);
    });
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
        {companions.map((companion,index) => (
          <div
            key={`${companion.id}-${index}`}
            className="relative"
          >
            <CompanionCard
              key={companion.id}
              {...companion}
              color={getSubjectColor(companion.subject)}
              href={`/companion/conversation`}
            />
          </div>
        ))}
        {/* --- HIỂN THỊ SKELETON KHI ĐANG TẢI --- */}
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <CompanionCardSkeleton key={index} />
          ))}
      </div>

      {/* Phần tử trigger để tải thêm */}
      <div ref={ref} className="h-1 w-full"></div>

      <div className="flex justify-center mt-8">
        {!isLoading && !hasNextPage && companions.length > 0 && (
          <p className="text-gray-500">You&apos;ve reached the end!</p>
        )}
      </div>
    </>
  );
}
