// File: app/community/page.tsx
import { getAllCompanions } from "@/lib/actions/companion.actions"; // Cần tạo action này
import { CompanionList } from "@/components/companion/CompanionList";
import { SearchParams } from "@/types";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
// ...

const CommunityPage = async ({ searchParams }: SearchParams) => {
  const user = await getCurrentUser();

  if (!user) redirect("/companion-library");
  const filters = await searchParams;
  // Fetch các companion công khai
  const initialData = await getAllCompanions({
    page: 1,
    isPublic: true,
    ...searchParams,
  });

  return (
    <section className="container py-8 mx-auto">
      <h1 className="text-3xl font-bold">Community Companions</h1>
      <p className="mt-2 text-muted-foreground">
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
