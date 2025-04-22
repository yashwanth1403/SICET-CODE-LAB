//assessment/ongoing/[assessmentId]/page.tsx

import { fetchAssessmentById } from "@/actions/TestAssessment";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import AssessmentPageClient from "@/components/AssessmentPageClient";

interface PageParams {
  params: {
    assessmentId: string;
  };
}

// Server component wrapper
export default async function OngoingAssessmentPage({ params }: PageParams) {
  const session = await auth();
  const { assessmentId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !session?.user?.batch ||
    !session?.user?.department ||
    !session?.user?.id
  ) {
    throw new Error("Missing user information in session");
  }

  // Check if attempt exists and is completed
  const attemptTracker = await prisma.attemptTracker.findUnique({
    where: {
      studentId_assessmentId: {
        studentId: session.user.id,
        assessmentId: assessmentId,
      },
    },
  });

  // If attempt is marked as completed, redirect to completed page
  if (attemptTracker?.isCompleted) {
    redirect(`/assessment/completed/${assessmentId}`);
  }

  // Fetch the assessment data
  const assessmentData = await fetchAssessmentById(
    assessmentId,
    session.user.batch,
    session.user.department
  );

  if (!assessmentData) {
    throw new Error("Assessment not found");
  }

  return (
    <AssessmentPageClient initialData={assessmentData} session={session} />
  );
}
