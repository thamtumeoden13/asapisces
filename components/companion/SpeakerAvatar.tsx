 // components/companion/SpeakerAvatar.tsx
import Image from "next/image";
import { cn } from "@/lib/utils"; // Import cn utility

interface SpeakerAvatarProps {
  name: string;
  image: string;
  isActive: boolean;
}

export const SpeakerAvatar = ({
  name,
  image,
  isActive,
}: SpeakerAvatarProps) => (
  <div
    className={cn(
      `flex flex-col items-center justify-end h-full gap-2 md:gap-4 
       transition-all duration-300`,
      // --- LOGIC HIỂN THỊ ---
      isActive
        ? "opacity-100 scale-100"
        : "opacity-60 scale-95",
      // --- LOGIC KÍCH THƯỚC KHI FULLSCREEN ---
      // Khi `group` (container cha) có class `fullscreen`, các class này sẽ được áp dụng
      "group-[.fullscreen]:scale-110" // Phóng to toàn bộ component
    )}
  >
    <div
      className={cn(
        "relative w-24 h-24 md:w-32 md:h-32",
        // Phóng to kích thước của container ảnh khi fullscreen
        "group-[.fullscreen]:w-32 group-[.fullscreen]:h-32 lg:group-[.fullscreen]:w-48 lg:group-[.fullscreen]:h-48"
      )}
    >
      <Image
        src={image}
        alt={name}
        fill // Sử dụng `fill` để ảnh lấp đầy container
        className="rounded-full object-cover border-4 border-gray-600"
      />
    </div>
    <span
      className={cn(
        "font-bold text-base md:text-lg",
        // Phóng to cỡ chữ khi fullscreen
        "group-[.fullscreen]:text-lg lg:group-[.fullscreen]:text-2xl"
      )}
    >
      {name}
    </span>
  </div>
);