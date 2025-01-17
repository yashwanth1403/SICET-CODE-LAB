import { auth } from "@/auth";
import AdminLoginForm from "@/components/AdminLogin";
import { redirect } from "next/navigation";
import { ToastContainer } from "react-toastify";

const Login = async () => {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 w-full">
      <ToastContainer
        position="top-center"
        autoClose={2500}
        closeOnClick={true}
        pauseOnHover={true}
      />
      <AdminLoginForm />
    </div>
  );
};

export default Login;
