import { auth } from "@/auth";
import { OngoingAssessments } from "@/actions/AssessmentFetch";
import { fetchAssessmentById } from "@/actions/TestAssessment";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AssessmentStatus } from "@prisma/client";

// Type definitions for assessment data
interface Problem {
  id: string;
  questionType: "CODING" | "MULTIPLE_CHOICE";
}

interface DetailedAssessment {
  id: string;
  title: string;
  batch: string[];
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  topics: string[];
  status: AssessmentStatus;
  problems?: Problem[];
}

const AssessmentPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  } else if (session.user.role === "admin") {
    redirect("admin/dashboard");
  }

  // Ensure we have all required data
  if (!session.user.id || !session.user.batch || !session.user.department) {
    redirect("/profile"); // Redirect to profile to complete user information
  }

  const initialOngoingAssessments = await OngoingAssessments(
    session.user.batch,
    session.user.department
  );

  // Check if there are any ongoing assessments
  if (initialOngoingAssessments.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-md rounded-xl bg-gray-800/70 p-8 text-center shadow-2xl backdrop-blur-sm border border-gray-700">
          <div className="flex justify-center mb-6">
            <svg
              className="w-16 h-16 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-2xl font-bold text-white">
            No Ongoing Assessments
          </h2>
          <p className="text-gray-300">
            There are no assessments in progress at this time.
          </p>
        </div>
      </div>
    );
  }

  // Format date for display with more detailed information
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  // Fetch detailed assessment data including problems for accurate question type counts
  const assessmentsWithDetails: DetailedAssessment[] = await Promise.all(
    initialOngoingAssessments.map(async (assessment) => {
      if (session.user.batch && session.user.department) {
        const detailedData = await fetchAssessmentById(
          assessment.id,
          session.user.batch,
          session.user.department
        );
        return detailedData || assessment;
      }
      return assessment as DetailedAssessment;
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl p-8 mb-10 backdrop-blur-sm border border-gray-800">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <svg
              className="w-6 h-6 mr-3 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Ongoing Assessments
          </h1>
          <p className="text-gray-400 mt-2 ml-9">
            Active assessments for {session.user.batch},{" "}
            {session.user.department} department
          </p>
        </div>

        <div className="space-y-6">
          {assessmentsWithDetails.map((assessment) => {
            // Calculate remaining time
            const endTime = new Date(assessment.endTime);
            const now = new Date();
            const timeLeftMs = endTime.getTime() - now.getTime();
            const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
            const minutesLeft = Math.floor(
              (timeLeftMs % (1000 * 60 * 60)) / (1000 * 60)
            );

            // Format time remaining nicely
            const timeRemaining =
              timeLeftMs > 0
                ? `${hoursLeft}h ${minutesLeft}m remaining`
                : "Ending soon";

            // Progress bar calculation
            const startTime = new Date(assessment.startTime);
            const totalDurationMs = endTime.getTime() - startTime.getTime();
            const elapsedMs = now.getTime() - startTime.getTime();
            const progressPercent = Math.min(
              100,
              Math.max(0, (elapsedMs / totalDurationMs) * 100)
            );

            // Calculate percentage of time remaining for color
            const percentRemaining = (timeLeftMs / totalDurationMs) * 100;
            let progressColor = "from-green-400 to-blue-500";
            if (percentRemaining < 25) {
              progressColor = "from-red-500 to-orange-500";
            } else if (percentRemaining < 50) {
              progressColor = "from-yellow-400 to-orange-400";
            }

            // Count question types correctly
            const codingQuestions =
              assessment.problems?.filter(
                (p: Problem) => p.questionType === "CODING"
              ).length || 0;

            const mcqQuestions =
              assessment.problems?.filter(
                (p: Problem) => p.questionType === "MULTIPLE_CHOICE"
              ).length || 0;

            return (
              <div
                key={assessment.id}
                className="bg-gray-800/80 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all shadow-lg backdrop-blur-sm hover:shadow-blue-900/20 hover:shadow-lg"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-bold text-white">
                      {assessment.title}
                    </h2>
                    <div className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full text-xs font-medium text-white flex items-center">
                      <svg
                        className="w-3 h-3 mr-1 text-blue-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {timeRemaining}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-4">
                    <div
                      className={`bg-gradient-to-r ${progressColor} h-1.5 rounded-full`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-700/30 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-blue-400 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <div className="text-xs text-gray-400">Duration</div>
                          <div className="text-sm font-medium text-white">
                            {assessment.duration} min
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-green-400 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <div>
                          <div className="text-xs text-gray-400">Questions</div>
                          <div className="text-sm font-medium text-white">
                            {assessment.totalQuestions}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-cyan-400 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                        <div>
                          <div className="text-xs text-gray-400">Coding</div>
                          <div className="text-sm font-medium text-white">
                            {codingQuestions}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-2.5 backdrop-blur-sm">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 text-purple-400 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <div className="text-xs text-gray-400">MCQ</div>
                          <div className="text-sm font-medium text-white">
                            {mcqQuestions}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {assessment.topics && assessment.topics.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center mb-1.5">
                        <svg
                          className="w-4 h-4 text-gray-400 mr-1.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        <span className="text-xs text-gray-400">Topics:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {assessment.topics.map((topic, index) => (
                          <span
                            key={index}
                            className="bg-gray-700/50 text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time information card */}
                  <div className="bg-gray-700/20 rounded-lg p-3 mb-4 backdrop-blur-sm">
                    <div className="text-xs text-gray-400 mb-2 font-medium">
                      Assessment Schedule
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-full bg-blue-900/30 flex items-center justify-center mr-3">
                          <svg
                            className="w-4 h-4 text-blue-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">
                            Started
                          </div>
                          <div className="text-sm font-medium text-white">
                            {formatDate(assessment.startTime)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-full bg-red-900/30 flex items-center justify-center mr-3">
                          <svg
                            className="w-4 h-4 text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">
                            Ends
                          </div>
                          <div className="text-sm font-medium text-white">
                            {formatDate(assessment.endTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Link
                      href={`/assessment/ongoing/${assessment.id}`}
                      className="block w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-2.5 px-4 rounded-lg text-center font-medium transition-all flex items-center justify-center shadow-lg shadow-blue-700/20 transform hover:translate-y-[-2px]"
                    >
                      <svg
                        className="w-5 h-5 mr-2 text-blue-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Open Assessment
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
