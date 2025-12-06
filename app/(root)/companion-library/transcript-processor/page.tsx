import { redirect } from "next/navigation";

/**
 * Route : /transcript-processor
 * Renders the transcript-processing playground
 */

import TranscriptProcessorComponent from "@/components/companion/transcript-processor";
import { getCurrentUser } from "@/lib/actions/auth.action";

export default async function TranscriptProcessorPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  return (
    <main className="min-h-screen bg-white py-10">
      <TranscriptProcessorComponent />
    </main>
  );
}
