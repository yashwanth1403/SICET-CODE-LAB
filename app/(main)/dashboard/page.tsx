import { auth } from "@/auth";
import StudentDashboard from "@/components/StudentDashboard";
import { redirect } from "next/navigation";
import { UpcomingAssessments } from "@/actions/AssessmentFetch";
const DashboardPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  } else if (session.user.role === "admin") {
    redirect("admin/dashboard");
  }

  // Fetch data at the server level
  if (session.user.batch && session.user.department) {
    const upcomingAssessments = await UpcomingAssessments(
      session.user.batch,
      session.user.department
    );
    return (
      <StudentDashboard
        user={{
          name: session.user.name || "",
          collegeId: session.user.collegeId,
          batch: session.user.batch,
          department: session.user.department,
        }}
        upcomingAssessments={upcomingAssessments}
      />
    );
  }
};

export default DashboardPage;
