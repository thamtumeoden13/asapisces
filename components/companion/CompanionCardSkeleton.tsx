// File: components/companion/CompanionCardSkeleton.tsx
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CompanionCardSkeleton() {
  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-2xl border-2 bg-gray-50 border-gray-200 animate-pulse w-96">
      <CardHeader className="p-4">
        {/* Mô phỏng Badge */}
        <Skeleton className="h-6 w-20 rounded-full bg-gray-200" />
        {/* Mô phỏng CardTitle */}
        <div className="pt-4 space-y-2">
          <Skeleton className="h-5 w-3/4 bg-gray-300" />
          <Skeleton className="h-5 w-1/2 bg-gray-300" />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        {/* Mô phỏng CardDescription */}
        <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-5/6 bg-gray-200" />
        </div>
      </CardContent>
      <CardFooter className="p-4 flex flex-col items-start gap-4 mt-auto">
        {/* Mô phỏng Duration */}
        <Skeleton className="h-5 w-24 bg-gray-200" />
        {/* Mô phỏng Button */}
        <Skeleton className="h-12 w-full rounded-xl bg-gray-300" />
      </CardFooter>
    </Card>
  );
}