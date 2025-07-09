import React from "react";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getCompanion } from "@/lib/actions/companion.actions";
import { redirect } from "next/navigation";
import VapiConversationComponent from "@/components/companion/VapiConversationComponent";

interface ConversationSessionProps {
  params: Promise<{
    id: string;
  }>;
}

const ConversationPage = async ({ params }: ConversationSessionProps) => {
  const { id } = await params;
  const companion = await getCompanion(id);
  const user = await getCurrentUser();

  const { name, subject, topic, duration } = companion;

  if (!user) redirect("/sign-in");
  if (!name) redirect("/companions");
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container px-4 py-8 mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
            AI Conversation Practice
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Practice English conversation with AI companions using advanced
            voice recognition and real-time feedback
          </p>
        </div>
        <VapiConversationComponent
          {...companion}
          companionId={id}
          transcriptData={companion.transcript_data}
          userName={user.name!}
          userImage={user.image!}
        />
      </div>
    </div>
  );
};

export default ConversationPage;
