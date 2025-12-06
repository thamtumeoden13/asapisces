import { redirect } from "next/navigation";

/**
 * Route : /transcript-processor
 * Renders the transcript-processing playground
 */

import TranscriptProcessorComponent from "@/components/companion/transcript-processor";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getCompanionById } from "@/lib/actions/companion.actions";

interface TranscriptProcessorProps {
  params: Promise<{
    id: string;
  }>;
}

const TranscriptProcessorPage = async ({
  params,
}: TranscriptProcessorProps) => {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  const { id } = await params;
  const companion = await getCompanionById(id);
  if (!companion) redirect("/companion-library");

  return (
    <main className="min-h-screen py-10 bg-white">
      <TranscriptProcessorComponent editMode={true} companionData={companion} />
    </main>
  );
};

export default TranscriptProcessorPage;
