export const PopularSectionSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="w-1/4 h-6 bg-gray-200 rounded-md animate-pulse"></div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="p-4 bg-gray-100 border border-gray-200 rounded-xl animate-pulse">
      <div className="flex items-center justify-between mb-4">
        {/* Subject Tag Skeleton */}
        <div className="w-24 h-6 bg-gray-300 rounded-full"></div>
        {/* Bookmark Icon Skeleton */}
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      </div>
      {/* Title Skeleton */}
      <div className="w-3/4 h-6 mb-3 bg-gray-300 rounded-md"></div>
      {/* Description Skeleton */}
      <div className="w-full h-4 mb-1 bg-gray-200 rounded-md"></div>
      <div className="w-5/6 h-4 mb-6 bg-gray-200 rounded-md"></div>
      {/* Duration Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
        <div className="w-16 h-4 bg-gray-300 rounded-md"></div>
      </div>
      {/* Button Skeleton */}
      <div className="w-full h-12 bg-gray-300 rounded-lg"></div>
    </div>
  );
};
