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
import { Clock, Lock, Loader2, LockIcon } from "lucide-react"; // THÊM ICONS MỚI
import { cn } from "@/lib/utils";
import { BookmarkButton } from "./BookmarkButton";

type CompanionCardProps = {
  id: string;
  name: string;
  topic: string;
  subject: string;
  duration: number;
  href: string;
  bookmarked: boolean;
  role: string;
  status: "processing" | "ready" | "failed";
};

export const subjectColors: Record<string, { bg: string; border: string }> = {
  // --- Các màu cũ được chuyển đổi sang Tailwind CSS ---
  maths: { bg: "bg-yellow-100", border: "border-yellow-300" },
  language_learning: { bg: "bg-blue-100", border: "border-blue-300" },
  science: { bg: "bg-purple-100", border: "border-purple-300" },
  history: { bg: "bg-orange-100", border: "border-orange-300" },
  coding: { bg: "bg-pink-100", border: "border-pink-300" },
  economics: { bg: "bg-green-100", border: "border-green-300" },

  // --- Các màu mới được bổ sung ---
  business: { bg: "bg-indigo-100", border: "border-indigo-300" },
  finance: { bg: "bg-emerald-100", border: "border-emerald-300" },
  technology: { bg: "bg-cyan-100", border: "border-cyan-300" },
  health_wellness: { bg: "bg-amber-100", border: "border-amber-300" },
  personal_development: { bg: "bg-red-100", border: "border-red-300" },
  psychology: { bg: "bg-slate-100", border: "border-slate-300" },
  arts_culture: { bg: "bg-fuchsia-100", border: "border-fuchsia-300" },
  philosophy: { bg: "bg-stone-100", border: "border-stone-300" },

  // --- Màu mặc định để dự phòng ---
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
  role,
  status,
}: CompanionCardProps) {
  const colors = subjectColors[subject.toLowerCase()] || subjectColors.default;

  const isReady = status === "ready";
  const isProcessing = status === "processing";
  const hasFailed = status === "failed";

  // Bọc nội dung của thẻ vào một biến để tái sử dụng
  const CardInnerContent = (
    <>
      <BookmarkButton
        companionId={id}
        initialBookmarked={bookmarked}
        role={role}
        // isProcessing={isProcessing}
      />
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
        <Button
          className="w-full bg-gray-900 text-white rounded-xl h-12 text-md font-semibold hover:bg-gray-700"
          // Vô hiệu hóa nút nếu chưa sẵn sàng
          disabled={!isReady}
        >
          {isProcessing && (
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          )}
          {hasFailed && <LockIcon className="w-4 h-4 mr-2 text-red-500" />}
          {isReady ? "Launch Lesson" : "Preparing..."}
        </Button>
      </CardFooter>
    </>
  );

  const CardWrapper = (
    // Thêm `relative` để chứa lớp phủ
    <div className="relative h-full">
      <Card
        className={cn(
          "flex flex-col h-full overflow-hidden rounded-2xl border-2 transition-all duration-300",
          // Style mặc định
          colors.bg,
          colors.border,
          // Chỉ áp dụng hiệu ứng hover nếu thẻ sẵn sàng
          isReady && "hover:shadow-xl hover:-translate-y-1",
          // Làm cho thẻ không thể tương tác nếu chưa sẵn sàng
          !isReady && "cursor-not-allowed"
        )}
      >
        {CardInnerContent}
      </Card>
    </div>
  );

  if (isReady) {
    // Nếu sẵn sàng, bọc toàn bộ thẻ trong thẻ Link
    return (
      <Link href={`${href}/${id}`} className="block h-full">
        {CardWrapper}
      </Link>
    );
  }

  // Nếu không, chỉ hiển thị thẻ không thể click
  return CardWrapper;
}
