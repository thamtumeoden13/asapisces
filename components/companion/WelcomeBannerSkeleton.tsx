
export const WelcomeBannerSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-between gap-4 md:flex-row animate-pulse">
      <div className="w-full p-6 bg-gray-100 rounded-lg md:w-3/4">
        <div className="w-1/2 h-8 mb-2 bg-gray-300 rounded-md"></div>
        <div className="w-3/4 h-4 bg-gray-200 rounded-md"></div>
      </div>
      <div className="flex flex-col items-center justify-center w-full p-6 bg-gray-100 rounded-lg md:w-1/4 h-28">
        <div className="w-10 h-10 mb-2 bg-gray-300 rounded-full"></div>
        <div className="w-20 h-4 bg-gray-300 rounded-md"></div>
      </div>
    </div>
  );
};
