export const WelcomeBannerSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-between gap-4 md:flex-row animate-pulse">
      <div className="flex flex-row w-full gap-4 bg-gray-100 rounded-lg p-6">
        <div className="w-full p-6 items-center">
          <div className="w-1/2 h-8 mb-2 bg-gray-300 rounded-md"></div>
          <div className="w-3/4 h-4 bg-gray-200 rounded-md"></div>
        </div>
        <div className="flex flex-col items-center justify-center w-full p-6 bg-gray-200 rounded-lg md:w-1/4 h-28">
          <div className="w-10 h-10 mb-2 bg-gray-300 rounded-full"></div>
          <div className="w-10 h-4 mb-2 bg-gray-300 rounded-md"></div>
          <div className="w-40 h-4 bg-gray-300 rounded-md"></div>
        </div>
      </div>
    </div>
  );
};
