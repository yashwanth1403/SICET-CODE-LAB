import { auth } from "@/auth";
import CreateAssessment from "@/components/AdminDashboard";
import { redirect } from "next/navigation";

const AdminDashboardPage = async () => {
  const authUser = await auth();

  if (!authUser) {
    redirect("admin/signup");
  }

  if (authUser?.user.role == "admin") {
    return (
      <div>
        <CreateAssessment professorId={`${authUser.user.collegeId}`} />
      </div>
    );
  }
  return <div>unAuthorized access</div>;
};

export default AdminDashboardPage;
