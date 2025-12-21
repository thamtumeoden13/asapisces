// File: components/companion/BookmarkButton.tsx
"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Edit2, Heart } from "lucide-react";
import { toggleBookmarkAction } from "@/lib/actions/bookmark.action"; // Import action mới
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface BookmarkButtonProps {
  companionId: string;
  initialBookmarked: boolean;
  role: string;
}

export function BookmarkButton({
  companionId,
  initialBookmarked,
  role,
}: BookmarkButtonProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const route = useRouter()

  // State để quản lý trạng thái hiển thị của nút
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  const handleBookmark = (e: React.MouseEvent) => {
    // Ngăn sự kiện click lan ra thẻ <Link> cha, tránh điều hướng không mong muốn
    e.preventDefault();
    e.stopPropagation();

    // --- CẬP NHẬT GIAO DIỆN LẠC QUAN ---
    // Ngay lập tức thay đổi trạng thái UI mà không cần chờ server phản hồi
    setIsBookmarked((prev) => !prev);

    // Bắt đầu gọi Server Action ở chế độ "transition"
    startTransition(async () => {
      const result = await toggleBookmarkAction(companionId, pathname);

      // --- XỬ LÝ KẾT QUẢ TỪ SERVER ---
      if (result?.error) {
        // Nếu server báo lỗi, hoàn tác lại thay đổi trên UI
        setIsBookmarked((prev) => !prev);
        console.error(result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update bookmark.",
        });
      } else {
        // Nếu thành công, có thể hiển thị thông báo
        toast({ title: !isBookmarked ? "Bookmarked!" : "Bookmark removed!" });
        // Không cần làm gì với state `isBookmarked` vì nó đã đúng
      }
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    // Ngăn sự kiện click lan ra thẻ <Link> cha, tránh điều hướng không mong muốn
    e.preventDefault();
    e.stopPropagation();

    window.open(`/companion-library/transcript-processor/${companionId}`, '_blank');
  };

  return (
    <div className="flex flex-row gap-2 absolute top-4 right-4">
      <button
        onClick={handleBookmark}
        disabled={isPending} // Vô hiệu hóa nút khi đang xử lý
        className="p-2 gap-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-10"
        aria-label="Toggle bookmark"
      >
        <Heart
          className={cn(
            "w-5 h-5 transition-all",
            // Sử dụng isBookmarked để điều khiển giao diện
            isBookmarked ? "text-red-500 fill-red-500" : "text-white/80"
          )}
        />
      </button>
      {role === "admin" && (
        <button
          onClick={handleEdit}
          disabled={isPending} // Vô hiệu hóa nút khi đang xử lý
          className="p-2 gap-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-10"
          aria-label="Toggle bookmark"
        >
          <Edit2 className={cn("w-5 h-5 transition-all text-gray-500")} />
        </button>
      )}
    </div>
  );
}
