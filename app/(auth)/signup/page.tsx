import { auth } from "@/auth";
import CollegeSignupForm from "@/components/CollegeSignupForm";
import { redirect } from "next/navigation";
import { ToastContainer } from "react-toastify";

const Signup = async () => {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        closeOnClick={true}
        pauseOnHover={true}
      />
      <CollegeSignupForm />
    </div>
  );
};

export default Signup;
