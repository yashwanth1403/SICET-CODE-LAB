//assessment/ongoing/[assessmentId]/page.tsx

import { fetchAssessmentById } from "@/actions/TestAssessment";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AssessmentOverview } from "@/components/test/AssessmentOverview";
import { Provider } from "jotai";
import prisma from "@/lib/db";

interface PageParams {
  params: {
    assessmentId: string;
  };
}

// Server component wrapper
export default async function OngoingAssessmentPage({ params }: PageParams) {
  const session = await auth();
  const { assessmentId } = params;

  if (!session?.user) {
    redirect("/login");
  }

  if (!session?.user?.batch || !session?.user?.department) {
    throw new Error("Missing batch or department in session");
  }

  // Check if attempt exists and is completed
  const attemptTracker = await prisma.attemptTracker.findUnique({
    where: {
      studentId_assessmentId: {
        studentId: session.user.id as string,
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
    <Provider>
      <AssessmentOverview initialData={assessmentData} />
    </Provider>
  );
}
