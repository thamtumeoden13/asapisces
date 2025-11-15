// File: app/community/page.tsx
import { getAllCompanions } from "@/lib/actions/companion.actions"; // Cần tạo action này
import { CompanionList } from "@/components/companion/CompanionList";
import { SearchParams } from "@/types";
// ...

const CommunityPage = async ({ searchParams }: SearchParams) => {
  const filters = await searchParams;
  // Fetch các companion công khai
  const initialData = await getAllCompanions({
    page: 1,
    isPublic: true,
    ...searchParams,
  });

  return (
    <section className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Community Companions</h1>
      <p className="text-muted-foreground mt-2">
        Practice with lessons created by other users.
      </p>

      {/* Search/Filter có thể được thêm vào đây */}

      <div className="mt-8">
        <CompanionList
          initialCompanions={initialData.companions}
          initialHasNextPage={initialData.hasNextPage}
          filters={filters}
        />
      </div>
    </section>
  );
};
export default CommunityPage;
