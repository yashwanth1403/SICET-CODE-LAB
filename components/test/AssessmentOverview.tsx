"use client";
import React, { useEffect, useState } from "react";
import {
  User,
  Code,
  ListChecks,
  LayoutDashboard,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { useSession } from "next-auth/react";
import {
  assessmentAtom,
  TestAssessmentType,
  TestProblem,
} from "@/lib/store/atom/testAssessment";

interface AssessmentOverviewProps {
  initialData: TestAssessmentType | null;
}

export const AssessmentOverview: React.FC<AssessmentOverviewProps> = ({
  initialData,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const assessment = initialData;
  const [atomAssessment, setAssessment] = useAtom(assessmentAtom);
  // Add state for MCQ submissions
  const [mcqSubmissions, setMcqSubmissions] = useState<Record<string, boolean>>(
    {}
  );
  const [mcqSubmissionsLoaded, setMcqSubmissionsLoaded] = useState(false);

  useEffect(() => {
    setAssessment(initialData);
  }, [initialData, setAssessment]);

  // Add a useEffect to fetch MCQ submissions
  useEffect(() => {
    if (!assessment) return;

    const fetchMcqSubmissions = async () => {
      try {
        const response = await fetch(
          `/api/submissions/assessment?assessmentId=${assessment.id}&type=MCQ`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.submissions) {
            // Create a mapping of problemId -> isCompleted
            const submissionsMap: Record<string, boolean> = {};
            data.submissions.forEach((submission: { problemId: string }) => {
              submissionsMap[submission.problemId] = true;
            });
            setMcqSubmissions(submissionsMap);
          }
        } else {
          console.error(
            "Failed to fetch MCQ submissions:",
            response.statusText
          );
        }

        setMcqSubmissionsLoaded(true);
      } catch (error) {
        console.error("Error fetching MCQ submissions:", error);
        setMcqSubmissionsLoaded(true);
      }
    };

    // Only fetch if we have an assessment with MCQ problems
    if (assessment.problems.some((p) => p.questionType === "MULTIPLE_CHOICE")) {
      fetchMcqSubmissions();
    } else {
      setMcqSubmissionsLoaded(true);
    }
  }, [assessment]);

  // Add a useEffect that checks localStorage for updates to problem submissions periodically
  useEffect(() => {
    if (!assessment) return;

    // Function to load latest submissions from localStorage
    const loadLatestSubmissions = () => {
      // Create a copy of the assessment
      const updatedAssessment = { ...assessment };
      let updated = false;

      // Update each problem with its latest submission data from localStorage
      updatedAssessment.problems = assessment.problems.map((problem) => {
        // Try to get the problem submission from localStorage
        const storageKey = `assessment_code_${assessment.id}_${problem.id}`;
        try {
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            const submission = JSON.parse(savedData);
            // Only update if we don't already have submission data or if the localStorage data is newer
            if (
              !problem.submission ||
              (submission.lastSaved &&
                (!problem.submission.lastSaved ||
                  new Date(submission.lastSaved) >
                    new Date(problem.submission.lastSaved)))
            ) {
              updated = true;
              console.log(
                `Updated submission for problem ${problem.id} found in localStorage`
              );
              return { ...problem, submission };
            }
          }
        } catch (error) {
          console.error(
            `Error loading submission for problem ${problem.id}:`,
            error
          );
        }
        return problem;
      });

      // Only update the assessment atom if we found new submission data
      if (updated) {
        console.log(
          "Updating assessment with latest submissions from localStorage"
        );
        setAssessment(updatedAssessment);
      }
    };

    // Load submissions immediately
    loadLatestSubmissions();

    // Set up polling to check for updates every 3 seconds
    const intervalId = setInterval(loadLatestSubmissions, 3000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [assessment?.id, setAssessment]);

  // Original useEffect to monitor atom changes
  useEffect(() => {
    console.log("Atom Assessment Updated:", atomAssessment);
  }, [atomAssessment]);

  // Add debug function to inspect localStorage
  useEffect(() => {
    if (!assessment) return;

    // Debug function to inspect localStorage
    const debugLocalStorage = () => {
      console.log("Debugging localStorage for assessment:", assessment.id);

      assessment.problems.forEach((problem) => {
        const storageKey = `assessment_code_${assessment.id}_${problem.id}`;
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
          try {
            const submission = JSON.parse(savedData);
            console.log(`Problem ${problem.id}:`, {
              status: submission.results?.status,
              testsPassed: submission.results?.testsPassed,
              totalTests: submission.results?.totalTests,
              submittedAt: submission.results?.submittedAt,
              lastSaved: submission.lastSaved,
            });
          } catch (error) {
            console.error(
              `Error parsing submission for problem ${problem.id}:`,
              error
            );
          }
        } else {
          console.log(`No localStorage data for problem ${problem.id}`);
        }
      });
    };

    // Run debug initially
    debugLocalStorage();

    // Set up interval to continuously monitor localStorage
    const intervalId = setInterval(debugLocalStorage, 5000);

    // Clean up interval
    return () => clearInterval(intervalId);
  }, [assessment]);

  const navigateToProblem = (problemId: string) => {
    if (assessment) {
      router.push(`/assessment/ongoing/${assessment.id}/problem/${problemId}`);
    }
  };

  const navigateToMcqSection = () => {
    if (assessment) {
      router.push(`/assessment/ongoing/${assessment.id}/mcq`);
    }
  };

  if (!assessment) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-gray-100 flex items-center justify-center">
        Loading assessment...
      </div>
    );
  }

  // Get coding problems and MCQ problems
  const codingProblems = assessment.problems.filter(
    (problem) => problem.questionType === "CODING"
  );

  const hasMcqProblems = assessment.problems.some(
    (problem) => problem.questionType === "MULTIPLE_CHOICE"
  );

  // Function to get accurate submission status directly from localStorage
  const getSubmissionStatusFromLocalStorage = (problemId: string) => {
    try {
      const storageKey = `assessment_code_${assessment.id}_${problemId}`;
      const savedData = localStorage.getItem(storageKey);

      if (savedData) {
        const submission = JSON.parse(savedData);
        return {
          code: submission.code,
          language: submission.language,
          lastSaved: submission.lastSaved,
          results: submission.results,
          hasCode: !!submission.code && submission.code.trim().length > 0,
          hasResults: !!submission.results,
          status: submission.results?.status || null,
        };
      }
    } catch (error) {
      console.error(
        `Error getting submission status for problem ${problemId}:`,
        error
      );
    }

    return null;
  };

  // Calculate progress - check localStorage directly for accurate status
  const problemStatuses =
    assessment?.problems.map((p) => {
      // For coding problems, check localStorage
      if (p.questionType === "CODING") {
        const status = getSubmissionStatusFromLocalStorage(p.id);
        return {
          problemId: p.id,
          status: status?.status || null,
          hasCode: status?.hasCode || false,
          hasResults: status?.hasResults || false,
          isMcq: false,
        };
      }
      // For MCQ problems, check the mcqSubmissions state
      else {
        return {
          problemId: p.id,
          status: mcqSubmissions[p.id] ? "COMPLETED" : null,
          hasCode: false,
          hasResults: false,
          isMcq: true,
          isCompleted: mcqSubmissions[p.id] || false,
        };
      }
    }) || [];

  // Count MCQ completed problems
  const completedMcqProblems = mcqSubmissionsLoaded
    ? problemStatuses.filter((p) => p.isMcq && p.isCompleted).length
    : 0;

  // Count coding completed problems
  const completedCodingProblems = problemStatuses.filter(
    (p) => !p.isMcq && (p.status === "PASSED" || p.status === "COMPLETED")
  ).length;

  // Total completed problems = coding + MCQ
  const completedProblems = completedCodingProblems + completedMcqProblems;

  // Problems that have run tests, regardless of result
  const attemptedProblems = problemStatuses.filter(
    (p) => !p.isMcq && (p.hasCode || p.hasResults || p.status === "ERROR")
  ).length;

  const problemsWithTestRuns = problemStatuses.filter(
    (p) => !p.isMcq && (p.hasResults || p.status === "ERROR")
  ).length;

  // Calculate accurate metrics for the Progress UI
  const codingAttemptedNotCompleted = Math.max(
    0,
    problemsWithTestRuns - completedCodingProblems
  );
  const codingStartedButNoTests = Math.max(
    0,
    attemptedProblems - problemsWithTestRuns
  );

  // Update the status display
  const isProblemInProgress = (problem: TestProblem) => {
    const status = getSubmissionStatusFromLocalStorage(problem.id);

    // Case 1: Has code but no results
    if (status?.hasCode && !status.hasResults) {
      return true;
    }

    // Case 2: Has results but hasn't passed
    if (
      status?.hasResults &&
      status.status !== "PASSED" &&
      status.status !== "COMPLETED"
    ) {
      return true;
    }

    return false;
  };

  // Include test runs in progress calculation
  const progressPercentage =
    assessment.problems.length > 0
      ? Math.round(
          ((completedProblems * 1.0 +
            (problemsWithTestRuns - completedProblems) * 0.5) /
            assessment.problems.length) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100">
      {/* Header */}
      <nav className="border-b border-gray-800/40 bg-[#0d1424] backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <h1 className="text-lg font-medium bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {assessment.title}
          </h1>

          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center p-2 hover:bg-gray-800 rounded-lg">
                <User className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {session?.user?.name || "User"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-64px)] p-6">
        <div className="flex-1 bg-[#0a0f1a]">
          {/* Assessment Info & Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Overview Card */}
            <div className="bg-[#0d1424] rounded-lg border border-gray-800/50 p-5 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-900/30 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-white">
                  Assessment Overview
                </h3>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Problems:</span>
                  <span className="text-white">
                    {assessment.problems.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Coding Problems:</span>
                  <span className="text-white">{codingProblems.length}</span>
                </div>
                {hasMcqProblems && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">MCQ Problems:</span>
                    <span className="text-white">
                      {assessment.problems.length - codingProblems.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* MCQ Section Card - only if there are MCQ problems */}
            {hasMcqProblems && (
              <div
                onClick={navigateToMcqSection}
                className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-800/30 p-5 shadow-lg cursor-pointer hover:border-purple-700/50 transition-all"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-900/50 border border-purple-800/30 flex items-center justify-center">
                    <ListChecks className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-white">
                    Multiple Choice Questions
                  </h3>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Complete all multiple choice questions in this section.
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-purple-300 text-sm">
                    {assessment.problems.length - codingProblems.length}{" "}
                    questions
                  </span>
                  <button className="px-3 py-1.5 bg-purple-800/50 text-purple-200 rounded-md text-sm hover:bg-purple-700/50 transition-colors">
                    Start MCQ Section
                  </button>
                </div>
              </div>
            )}

            {/* Time Remaining Card */}
            <div className="bg-[#0d1424] rounded-lg border border-gray-800/50 p-5 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-white">
                  Your Progress
                </h3>
              </div>
              <div className="mb-4">
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>
                    {attemptedProblems > 0 ? "In Progress" : "Not Started"}
                  </span>
                  <span>
                    {progressPercentage}% ({completedProblems}/
                    {assessment.problems.length} completed)
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Passed:</span>
                  <span className="text-green-400">{completedProblems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Attempted:</span>
                  <span className="text-blue-400">
                    {codingAttemptedNotCompleted}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Started:</span>
                  <span className="text-gray-400">
                    {codingStartedButNoTests}
                  </span>
                </div>
                {hasMcqProblems && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">MCQ Completed:</span>
                    <span className="text-purple-400">
                      {completedMcqProblems}
                    </span>
                  </div>
                )}
                {hasMcqProblems && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Coding Completed:</span>
                    <span className="text-green-400">
                      {completedCodingProblems}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Problems:</span>
                  <span className="text-gray-400">
                    {assessment.problems.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coding Problems Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-white px-4">
                Coding Problems
              </h2>
              <div className="text-sm text-gray-400 px-4">
                <span>
                  {attemptedProblems} of {codingProblems.length} attempted
                </span>
              </div>
            </div>

            <div className="bg-[#0d1424] rounded-lg border border-gray-800/50 overflow-hidden shadow-lg">
              <div className="grid grid-cols-12 text-xs font-medium text-gray-400 p-4 border-b border-gray-800/40 bg-gray-900/30">
                <div className="col-span-6">PROBLEM</div>
                <div className="col-span-2">DIFFICULTY</div>
                <div className="col-span-2">POINTS</div>
                <div className="col-span-2">ACTION</div>
              </div>

              <div>
                {codingProblems.map((problem, index) => (
                  <div
                    key={problem.id}
                    className="grid grid-cols-12 items-center p-4 border-b border-gray-800/20 hover:bg-[#13192b] transition-colors"
                  >
                    <div className="col-span-5 flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-blue-900/40 text-blue-300 rounded-full font-medium mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">
                          {problem.title || "Coding Problem"}
                        </h3>
                        <div className="flex items-center text-xs text-gray-400">
                          <Code className="h-3 w-3 text-blue-400 mr-1" />
                          <span>Coding Challenge</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      {problem.difficulty ? (
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            problem.difficulty === "Easy"
                              ? "bg-green-900/50 text-green-300"
                              : problem.difficulty === "Medium"
                              ? "bg-yellow-900/50 text-yellow-300"
                              : "bg-red-900/50 text-red-300"
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">
                          Not specified
                        </span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="px-2 py-1 bg-gray-800 rounded-md text-xs text-gray-300">
                        {problem.score}{" "}
                        {problem.score === 1 ? "point" : "points"}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center justify-between">
                      {/* Status indicator - now using direct localStorage status */}
                      {(() => {
                        const status = getSubmissionStatusFromLocalStorage(
                          problem.id
                        );

                        if (status?.hasResults) {
                          return (
                            <div className="flex items-center">
                              <span
                                className={`mr-2 px-2 py-1 rounded-md text-xs ${
                                  status.status === "PASSED" ||
                                  status.status === "COMPLETED"
                                    ? "bg-green-900/50 text-green-300"
                                    : status.status === "ERROR"
                                    ? "bg-orange-900/50 text-orange-300"
                                    : "bg-blue-900/50 text-blue-300"
                                }`}
                              >
                                {status.status === "PASSED" ||
                                status.status === "COMPLETED" ? (
                                  <span className="flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                    Passed
                                  </span>
                                ) : status.status === "ERROR" ? (
                                  <span className="flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" />{" "}
                                    Error
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> Attempted
                                  </span>
                                )}
                              </span>
                              {status.results?.testsPassed !== undefined && (
                                <span className="text-xs text-gray-400 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {status.results.testsPassed}/
                                  {status.results.totalTests || 0} tests
                                  {status.results.executionTime &&
                                    ` (${status.results.executionTime.toFixed(
                                      2
                                    )}s)`}
                                </span>
                              )}
                            </div>
                          );
                        } else if (status?.hasCode) {
                          return (
                            <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-md flex items-center">
                              <Clock className="w-3 h-3 mr-1 animate-pulse" />
                              In Progress
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-xs text-gray-500">
                              Not attempted
                            </span>
                          );
                        }
                      })()}
                      <button
                        className={`${
                          isProblemInProgress(problem)
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            : getSubmissionStatusFromLocalStorage(problem.id)
                                ?.status === "PASSED" ||
                              getSubmissionStatusFromLocalStorage(problem.id)
                                ?.status === "COMPLETED"
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        } text-white px-4 py-2 rounded-md text-sm transition-colors`}
                        onClick={() => navigateToProblem(problem.id)}
                      >
                        {isProblemInProgress(problem)
                          ? "Continue"
                          : getSubmissionStatusFromLocalStorage(problem.id)
                              ?.status === "PASSED" ||
                            getSubmissionStatusFromLocalStorage(problem.id)
                              ?.status === "COMPLETED"
                          ? "Completed"
                          : "Solve"}
                      </button>
                    </div>
                  </div>
                ))}

                {codingProblems.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    No coding problems found in this assessment.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
