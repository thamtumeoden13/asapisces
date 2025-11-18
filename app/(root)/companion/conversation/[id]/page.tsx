import React from "react";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getCompanionById } from "@/lib/actions/companion.actions";
import { redirect } from "next/navigation";
import ConversationComponent from "@/components/companion/ConversationComponent";

interface ConversationSessionProps {
  params: Promise<{
    id: string;
  }>;
}

const ConversationPage = async ({ params }: ConversationSessionProps) => {
  const { id } = await params;
  const companion = await getCompanionById(id);
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI Conversation Practice
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Practice English conversation with AI companions using advanced
            voice recognition and real-time feedback
          </p>
        </div>
        <ConversationComponent
          {...companion}
          companionId={id}
          transcriptData={companion.transcript_data}
          userName={user.name!}
          userImage={user.image!}
          userId={user.id!}
        />
      </div>
    </div>
  );
};

export default ConversationPage;
