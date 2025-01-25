import { auth } from "@/auth";
import CreateAssessment from "@/components/AdminDashboard";

const AdminDashboardPage = async () => {
  return (
    <div>
      <CreateAssessment />
    </div>
  );
};

export default AdminDashboardPage;
