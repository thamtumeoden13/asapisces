// File: components/companion/CompanionCard.tsx
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookmarkButton } from "./BookmarkButton";

// Cập nhật kiểu dữ liệu để khớp với thiết kế mới
type CompanionCardProps = {
  id: string;
  name: string; // Sẽ được dùng làm Title
  topic: string; // Sẽ được dùng làm Description
  subject: string;
  duration: number; // Duration tính bằng phút
  href: string; // Đường dẫn khi nhấp vào
  // Thêm color prop để nhận màu từ component cha
  color?: string;
  bookmarked: boolean;
};

// --- BẢNG MÀU TƯƠNG ỨNG VỚI CÁC SUBJECT ---
// Bạn có thể mở rộng bảng màu này
const subjectColors: Record<string, { bg: string; border: string }> = {
  science: { bg: "bg-purple-100", border: "border-purple-300" },
  economics: { bg: "bg-green-100", border: "border-green-300" },
  coding: { bg: "bg-pink-100", border: "border-pink-300" },
  default: { bg: "bg-gray-100", border: "border-gray-300" },
};

export default function CompanionCard({
  id,
  name,
  topic,
  subject,
  duration,
  href,
  bookmarked,
}: CompanionCardProps) {
  // Lấy màu dựa trên subject
  const colors = subjectColors[subject.toLowerCase()] || subjectColors.default;

  return (
    // Sử dụng Link để bọc toàn bộ card hoặc chỉ nút bấm
    <Link href={`${href}/${id}`} className="block h-full">
      <Card
        className={cn(
          "flex flex-col h-full overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
          colors.bg,
          colors.border
        )}
      >
        <BookmarkButton companionId={id} initialBookmarked={bookmarked} />
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
            <Badge
              variant="secondary"
              className="bg-gray-800 text-white hover:bg-gray-700 capitalize"
            >
              {subject}
            </Badge>
          </div>
          <CardTitle className="pt-4 text-xl font-bold text-gray-900 line-clamp-2">
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardDescription className="text-gray-600 line-clamp-3">
            {topic}
          </CardDescription>
        </CardContent>
        <CardFooter className="p-4 flex flex-col items-start gap-4 mt-auto">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4" />
            <span>{duration} minutes</span>
          </div>
          <Button className="w-full bg-gray-900 text-white rounded-xl h-12 text-md font-semibold hover:bg-gray-700">
            Launch Lesson
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
