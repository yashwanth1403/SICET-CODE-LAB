//assessment/ongoing/[assessmentId]/problem/[problemId]/page.tsx

import TestProblem from "@/components/test/TestProblem";
import { auth } from "@/auth";

interface PageParams {
  params: {
    assessmentId: string;
    problemId: string;
  };
}

const TestProblemPage = async ({ params }: PageParams) => {
  const { assessmentId, problemId } = params;

  // Get the authenticated user session
  const session = await auth();

  if (!session?.user?.id) {
    // Handle the case when user is not authenticated
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] text-white">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please sign in to access this problem.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TestProblem
        assessmentId={assessmentId}
        problemId={problemId}
        studentId={session.user.id}
      />
    </div>
  );
};

export default TestProblemPage;
