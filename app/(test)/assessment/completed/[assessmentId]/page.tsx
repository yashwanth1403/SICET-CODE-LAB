import { fetchAssessmentCompleted } from "@/actions/TestAssessment";
import { auth } from "@/auth";
import { CompletedAssessment } from "@/components/test/CompletedAssessment";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";

interface PageParams {
  params: {
    assessmentId: string;
  };
}

// Server component wrapper for the completed assessment page
export default async function CompletedAssessmentPage({ params }: PageParams) {
  const session = await auth();
  const { assessmentId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const userBatch = session.user.batch;
  const userDepartment = session.user.department;

  if (!userBatch || !userDepartment) {
    throw new Error("Missing batch or department in session");
  }

  // Check if the user has submitted the assessment
  const submissionCheck = await prisma.assessmentSubmission.findUnique({
    where: {
      studentId_assessmentId: {
        studentId: userId ?? "",
        assessmentId: assessmentId,
      },
    },
    select: {
      status: true,
    },
  });

  // Only allow access if the assessment has been submitted or completed
  if (
    !submissionCheck ||
    (submissionCheck.status !== "SUBMITTED" &&
      submissionCheck.status !== "COMPLETED" &&
      submissionCheck.status !== "TIMED_OUT")
  ) {
    // Redirect to assessments page if not submitted
    redirect("/assessments");
  }

  // Fetch the assessment data for this specific assessment
  const assessmentData = await fetchAssessmentCompleted(
    assessmentId,
    userBatch,
    userDepartment
  );

  if (!assessmentData) {
    throw new Error("Assessment not found");
  }

  return (
    <CompletedAssessment
      assessmentId={assessmentId}
      studentId={userId ?? ""}
      initialData={assessmentData}
    />
  );
}
