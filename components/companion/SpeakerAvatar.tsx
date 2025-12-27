// components/companion/SpeakerAvatar.tsx
import Image from "next/image";

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
    className={`flex flex-col items-center justify-end h-full gap-4 transition-all duration-300 ${isActive ? "opacity-100 scale-105" : "opacity-60 scale-100"}`}
  >
    <Image
      src={image}
      alt={name}
      width={128}
      height={128}
      className="rounded-full object-cover"
    />
    <span className="font-bold text-lg">{name}</span>
  </div>
);
