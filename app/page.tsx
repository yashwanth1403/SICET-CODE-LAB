import { Suspense, lazy } from "react";

// Dynamically import the CollegeSignupForm
const CollegeSignupForm = lazy(() => import("@/components/CollegeSignupForm"));

export default function Home() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <CollegeSignupForm />
      </Suspense>
    </div>
  );
}
