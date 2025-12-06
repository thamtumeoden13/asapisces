import { BookOpen, TrendingUp } from "lucide-react";
import React from "react";

const ConversationLoadingPage = () => {
  return (
    <div className="animate-pulse bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section Skeleton */}
        <div className="text-center mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-1/2 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-3/4 max-w-2xl mx-auto"></div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Learning Progress Skeleton */}
          <div className="max-w-7xl mx-auto w-full p-6 bg-white/50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <div className="h-6 w-1/4 bg-gray-200 rounded-md"></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Stat Item */}
              <div className="text-center space-y-2">
                <div className="h-8 w-1/4 mx-auto bg-gray-300 rounded-md"></div>
                <div className="h-4 w-1/2 mx-auto bg-gray-200 rounded-md"></div>
              </div>
              {/* Stat Item */}
              <div className="text-center space-y-2">
                <div className="h-8 w-1/4 mx-auto bg-gray-300 rounded-md"></div>
                <div className="h-4 w-1/2 mx-auto bg-gray-200 rounded-md"></div>
              </div>
              {/* Stat Item */}
              <div className="text-center space-y-2">
                <div className="h-8 w-1/4 mx-auto bg-gray-300 rounded-md"></div>
                <div className="h-4 w-1/2 mx-auto bg-gray-200 rounded-md"></div>
              </div>
              {/* Stat Item */}
              <div className="text-center space-y-2">
                <div className="h-8 w-1/4 mx-auto bg-gray-300 rounded-md"></div>
                <div className="h-4 w-1/2 mx-auto bg-gray-200 rounded-md"></div>
              </div>
            </div>
          </div>

          {/* Practice Settings Skeleton */}
          <div className="max-w-7xl mx-auto w-full p-6 bg-white/50 rounded-lg border border-gray-200 space-y-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <div className="h-6 w-1/4 bg-gray-200 rounded-md"></div>
            </div>

            {/* Choose Role Skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-1/5 bg-gray-200 rounded-md"></div>
              <div className="flex gap-4">
                <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
                <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
              </div>
            </div>

            {/* Switches Skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-2/5 bg-gray-200 rounded-md"></div>
              <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-5 w-2/5 bg-gray-200 rounded-md"></div>
              <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
            </div>

            {/* Choose Topic Skeleton */}
            <div>
              <div className="h-5 w-1/5 bg-gray-200 rounded-md mb-3"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div className="h-16 bg-gray-100 rounded-lg"></div>
                <div className="h-16 bg-gray-100 rounded-lg"></div>
                <div className="h-16 bg-gray-100 rounded-lg"></div>
                <div className="h-16 bg-gray-100 rounded-lg"></div>
                <div className="h-16 bg-gray-100 rounded-lg"></div>
                <div className="h-16 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>

          {/* Conversation Partner Skeleton */}
          <div className="max-w-7xl mx-auto w-full p-6 bg-white/50 rounded-lg border border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-6">
              {/* Avatar and Name */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 bg-gray-200 rounded-full"></div>
                <div className="space-y-2 text-center">
                  <div className="h-6 w-48 bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-32 mx-auto bg-gray-200 rounded-md"></div>
                </div>
              </div>
              {/* Controls */}
              <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <div className="h-12 bg-gray-200 w-full rounded-md"></div>
                <div className="h-10 w-3/4 bg-gray-200 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationLoadingPage;
