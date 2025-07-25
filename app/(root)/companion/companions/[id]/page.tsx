import CompanionComponent from "@/components/companion/CompanionComponent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getCompanion } from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";

interface CompanionSessionProps {
  params: Promise<{
    id: string;
  }>;
}

const CompanionSession = async ({ params }: CompanionSessionProps) => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { id } = await params;
  const companion = await getCompanion(id);
  const { name, subject, topic, duration } = companion;
  if (!name) redirect("/companions");
  // if (companion.author !== user.id) redirect("/companions");
  // if(companion.id !== id) redirect('/companions');
  // if(!companion.isPublished) redirect('/companions');
  // if(!companion.isActive) redirect('/companions');
  // if(!companion.isLive) redirect('/companions');
  // if(!companion.isSession) redirect('/companions');
  // if(!companion.isCompanion) redirect('/companions');
  // if(!companion.isCompanionSession) redirect('/companions');
  // if(!companion.isCompanionSessionActive) redirect('/companions');
  // if(!companion.isCompanionSessionLive) redirect('/companions');
  // if(!companion.isCompanionSessionPublished) redirect('/companions');
  // if(!companion.isCompanionSessionAvailable) redirect('/companions');
  // if(!companion.isCompanionSessionStarted) redirect('/companions');
  // if(!companion.isCompanionSessionEnded) redirect('/companions');
  // if(!companion.isCompanionSessionCompleted) redirect('/companions');
  // if(!companion.isCompanionSessionCancelled) redirect('/companions');
  // if(!companion.isCompanionSessionInProgress) redirect('/companions');
  // if(!companion.isCompanionSessionUpcoming) redirect('/companions');
  // if(!companion.isCompanionSessionPast) redirect('/companions');
  // if(!companion.isCompanionSessionOngoing) redirect('/companions');
  // if(!companion.isCompanionSessionArchived) redirect('/companions');
  // if(!companion.isCompanionSessionDraft) redirect('/companions');
  // if(!companion.isCompanionSessionPrivate) redirect('/companions');
  // if(!companion.isCompanionSessionPublic) redirect('/companions');
  // if(!companion.isCompanionSessionRestricted) redirect('/companions');
  // if(!companion.isCompanionSessionUnlisted) redirect('/companions');
  // if(!companion.isCompanionSessionFeatured) redirect('/companions');
  // if(!companion.isCompanionSessionHighlighted) redirect('/companions');
  // if(!companion.isCompanionSessionPinned) redirect('/companions');
  // if(!companion.isCompanionSessionPromoted) redirect('/companions');
  // if(!companion.isCompanionSessionSponsored) redirect('/companions');
  // if(!companion.isCompanionSessionVerified) redirect('/companions');
  // if(!companion.isCompanionSessionApproved) redirect('/companions');
  // if(!companion.isCompanionSessionRejected) redirect('/companions');
  // if(!companion.isCompanionSessionFlagged) redirect('/companions');
  // if(!companion.isCompanionSessionBanned) redirect('/companions');
  // if(!companion.isCompanionSessionDeleted) redirect('/companions');
  // if(!companion.isCompanionSessionRestored) redirect('/companions');
  // if(!companion.isCompanionSessionArchived) redirect('/companions');
  // if(!companion.isCompanionSessionUnarchived) redirect('/companions');
  // if(!companion.isCompanionSessionExpired) redirect('/companions');
  // if(!companion.isCompanionSessionCancelledByUser) redirect('/companions');
  // if(!companion.isCompanionSessionCancelledByAdmin) redirect('/companions');
  // if(!companion.isCompanionSessionCancelledBySystem) redirect('/companions');
  // if(!companion.isCompanionSessionCancelledByOwner) redirect('/companions');

  return (
    <section className="flex flex-col gap-8 bg-background h-full max-w-[1400px] pt-10 max-sm:px-2">
      <article className="flex rounded-border justify-between p-6 max-md:flex-col">
        <div className="flex items-center gap-2">
          <div
            className="size-[72px] flex items-center justify-center rounded-lg max-md:hidden"
            style={{ backgroundColor: getSubjectColor(subject) }}
          >
            <Image
              src={`/icons/${subject.toLowerCase()}.svg`}
              alt={subject}
              width={35}
              height={35}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="font-bold text-2xl text-black-100">{name}</p>
              <div className="subject-badge max-sm:hidden">{subject}</div>
            </div>

            <p className="text-lg text-black-300">{topic}</p>
          </div>
        </div>
        <div className="items-start text-2xl text-black-200 max-md:hidden">
          {duration} minutes
        </div>
      </article>

      <CompanionComponent
        {...companion}
        companionId={id}
        userName={user.name!}
        userImage={user.image!}
      />
    </section>
  );
};

export default CompanionSession;
