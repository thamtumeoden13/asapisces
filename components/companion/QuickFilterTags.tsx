// File: components/companion/QuickFilterTags.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export const popularSubjects = [
  "language_learning", // Thay thế cho "english"
  "personal_development", // Thay thế cho "daily-life", một chủ đề rất phổ biến
  "business", // Giữ nguyên
  "health_wellness", // Thay thế cho "travel", một chủ đề lối sống hấp dẫn
  "technology", // Giữ nguyên
];

export function QuickFilterTags() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSubject = searchParams.get("subject");

  const handleTagClick = (subject: string) => {
    const params = new URLSearchParams(searchParams);

    // Nếu nhấp vào tag đang active, hãy xóa bộ lọc
    if (currentSubject === subject) {
      params.delete("subject");
    } else {
      params.set("subject", subject);
    }

    // Xóa topic để tránh xung đột filter
    params.delete("topic");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-600">Popular topics:</span>
      {popularSubjects.map((subject) => (
        <Badge
          key={subject}
          variant={currentSubject === subject ? "default" : "secondary"}
          onClick={() => handleTagClick(subject)}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          {subject.replace("-", " ")}
        </Badge>
      ))}
    </div>
  );
}
