// File: components/companion/CompanionCardSkeleton.tsx
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CompanionCardSkeleton() {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-2 border-gray-200 rounded-2xl bg-gray-50 animate-pulse w-96">
      <CardHeader className="p-4">
        {/* Mô phỏng Badge */}
        <Skeleton className="w-20 h-6 bg-gray-200 rounded-full" />
        {/* Mô phỏng CardTitle */}
        <div className="pt-4 space-y-2">
          <Skeleton className="w-3/4 h-5 bg-gray-300" />
          <Skeleton className="w-1/2 h-5 bg-gray-300" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        {/* Mô phỏng CardDescription */}
        <div className="space-y-2">
            <Skeleton className="w-full h-4 bg-gray-200" />
            <Skeleton className="w-5/6 h-4 bg-gray-200" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 p-4 mt-auto">
        {/* Mô phỏng Duration */}
        <Skeleton className="w-24 h-5 bg-gray-200" />
        {/* Mô phỏng Button */}
        <Skeleton className="w-full h-12 bg-gray-300 rounded-xl" />
      </CardFooter>
    </Card>
  );
}