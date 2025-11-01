// File: components/companion/QuickFilterTags.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const popularSubjects = ["english", "business", "travel", "technology", "daily-life"];

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
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-600">Popular topics:</span>
      {popularSubjects.map(subject => (
        <Badge
          key={subject}
          variant={currentSubject === subject ? "default" : "secondary"}
          onClick={() => handleTagClick(subject)}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          {subject.replace('-', ' ')}
        </Badge>
      ))}
    </div>
  );
}