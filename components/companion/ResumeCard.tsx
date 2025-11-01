// File: components/companion/ResumeCard.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, History } from "lucide-react";
import { getSubjectColor } from "@/lib/utils"; // Giả sử bạn có hàm này

// Giả định kiểu dữ liệu Companion của bạn
type Companion = {
  id: string;
  name: string;
  topic: string;
  subject: string;
};

interface ResumeCardProps {
  companion: Companion;
}

export function ResumeCard({ companion }: ResumeCardProps) {
  if (!companion) return null;

  const subjectColor = getSubjectColor(companion.subject);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-black-100">
        <History className="w-6 h-6" />
        Continue Where You Left Off
      </h2>
      <Card
        className="overflow-hidden border-2 transition-all hover:shadow-lg"
        style={{ borderColor: subjectColor }}
      >
        <div className="flex flex-col md:flex-row">
          {/* Optional: Add an image for the companion */}
          {/* <div className="md:w-1/3 bg-gray-200">
            <img src={companion.image_url} alt={companion.name} className="object-cover h-full w-full" />
          </div> */}
          
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <CardHeader className="p-0 mb-2">
                <CardTitle className="text-2xl">{companion.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-gray-600">
                  You were last practicing the topic:{" "}
                  <span className="font-semibold">{companion.topic}</span> in{" "}
                  <span className="font-semibold capitalize">{companion.subject}</span>.
                </p>
              </CardContent>
            </div>
            <div className="mt-6">
              <Link href={`/companion/conversation/${companion.id}`} passHref>
                <Button className="w-full md:w-auto" style={{ backgroundColor: subjectColor }}>
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Resume Session
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}