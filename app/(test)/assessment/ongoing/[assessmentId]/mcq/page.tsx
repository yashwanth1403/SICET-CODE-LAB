import { fetchAssessmentById } from "@/actions/TestAssessment";
import { auth } from "@/auth";
import McqSection from "@/components/assessments/McqSection";
import { redirect } from "next/navigation";

// Define interface for params
interface McqPageProps {
  params: {
    assessmentId: string;
  };
}

// Server component wrapper
export default async function McqPage({ params }: McqPageProps) {
  // Extract and await params first to prevent Next.js warning
  const assessmentId = await params.assessmentId;

  const session = await auth();

  if (!session?.user?.id) {
    console.error("User is not authenticated");
    redirect("/login");
  }

  if (!session?.user?.batch || !session?.user?.department) {
    console.warn("Missing batch or department in session");
  }

  const initialData = await fetchAssessmentById(
    assessmentId,
    session.user.batch || "Unknown",
    session.user.department || "Unknown"
  );

  // If no assessment data, redirect to overview
  if (!initialData) {
    console.log("[SERVER] No assessment data found");
    redirect(`/assessment/ongoing/${assessmentId}`);
  }

  // Get all MCQ problems from the assessment
  const rawMcqProblems = initialData.problems.filter(
    (p) => p.questionType === "MULTIPLE_CHOICE"
  );
  console.log(`[SERVER] Found ${rawMcqProblems.length} MCQ problems`);

  // Map the data to match the expected McqProblem interface
  const mcqProblems = rawMcqProblems.map((problem) => ({
    id: problem.id,
    question: problem.description || problem.title,
    score: problem.score,
    choices:
      problem.choices?.map((choice) => ({
        id: choice.id,
        text: choice.text,
        isCorrect: choice.isCorrect,
      })) || [],
  }));

  // Ensure all MCQ problems have the choices property set
  mcqProblems.forEach((problem) => {
    // Check for problems without choices
    if (!problem.choices || problem.choices.length === 0) {
      console.warn(
        `[SERVER] WARNING: No choices found for MCQ problem ${problem.id} (${problem.question})`
      );
    }
  });

  // If no MCQ problems, redirect to overview
  if (mcqProblems.length === 0) {
    console.log("[SERVER] No MCQ problems found in this assessment");
    redirect(`/assessment/ongoing/${assessmentId}`);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">
          Multiple Choice Questions
        </h1>
        <McqSection
          assessmentId={assessmentId}
          mcqProblems={mcqProblems}
          studentId={session.user.id}
        />
      </div>
    </div>
  );
}
