import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchProfessorAssessmentSubmissions } from "@/actions/AssessmentFetch";
import SubmissionsClient from "@/components/admin/SubmissionsClient";

export default async function AdminSubmissionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  // Ensure user is an admin
  if (session.user.role !== "admin") {
    return (
      <div className="text-center p-10 text-red-500">
        Unauthorized: Only admins can access this page
      </div>
    );
  }

  const professorId = session.user.id;

  if (!professorId) {
    return (
      <div className="text-center p-10 text-red-500">
        Error: Professor ID not found
      </div>
    );
  }

  // Fetch all submissions for assessments created by this professor
  const submissionsByAssessment = await fetchProfessorAssessmentSubmissions(
    professorId
  );

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-white">
        Assessment Submissions
      </h1>
      <SubmissionsClient
        initialData={submissionsByAssessment}
        professorId={professorId}
      />
    </main>
  );
}
