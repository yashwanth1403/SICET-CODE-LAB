import { OngoingAssessments } from "@/actions/AssessmentFetch";
import { auth } from "@/auth";
import Assessment from "@/components/assement";
import { RealTimeAssessment } from "@/components/OngoingAssessment";
import { redirect } from "next/navigation";

const AssessmentPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  } else if (session.user.role === "admin") {
    redirect("admin/dashboard");
  }
  if (session.user.batch && session.user.department) {
    const initialOngoingAssessments = await OngoingAssessments(
      session.user.batch,
      session.user.department
    );
    return (
      <RealTimeAssessment
        batch={session.user.batch}
        department={session.user.department}
        initialAssessments={initialOngoingAssessments}
      />
    );
  }
};

export default AssessmentPage;
