import React from "react";
import { CompanionCardSkeleton } from "./CompanionCardSkeleton";

const CommunityLoadingPage = () => {
  return (
    <div className="animate-pulse bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Conversation Partner Skeleton */}
          <div className="companions-grid">
            {Array.from({ length: 12 }).map((_, index) => (
              <CompanionCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityLoadingPage;
