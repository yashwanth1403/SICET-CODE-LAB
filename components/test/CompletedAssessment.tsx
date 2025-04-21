"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAtom } from "jotai";
import {
  assessmentAtom,
  TestAssessmentType,
  ProblemSubmission,
} from "@/lib/store/atom/testAssessment";
import { Clock, Code, Trophy, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTime } from "@/lib/utils";
import { fetcher } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CompletedAssessmentProps {
  assessmentId: string;
  studentId: string;
  initialData: TestAssessmentType | null;
}

// Define better type for stats
interface AssessmentStats {
  duration?: number;
  totalScore?: number;
  maxScore?: number;
  problemsAttempted?: number;
  problemsCompleted?: number;
  codingScore?: number;
  mcqScore?: number;
}

interface SubmissionResult {
  id: string;
  problemId: string;
  studentId: string;
  code?: string;
  language?: string;
  selectedChoiceId?: string;
  status: string;
  score: number;
  createdAt: string | Date;
  executionTime?: number;
  memoryUsed?: number;
  errorMessage?: string;
  testResults?: {
    passed: number;
    total: number;
    results: Array<{
      testCaseId: string;
      passed: boolean;
      expectedOutput: string;
      actualOutput: string;
      isHidden: boolean;
    }>;
  };
  isCorrect?: boolean; // For MCQ submissions
  submittedAt: string | Date; // This will be the same as createdAt
  questionNumber?: number;
  questionPreview?: string;
}

export const CompletedAssessment: React.FC<CompletedAssessmentProps> = ({
  assessmentId,
  studentId,
  initialData,
}) => {
  const [assessment, setAssessment] = useAtom(assessmentAtom);
  const [submissions, setSubmissions] = useState<SubmissionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [attemptInfo, setAttemptInfo] = useState<{
    startTime: string;
    endTime: string;
    duration: number;
    isCompleted: boolean;
  } | null>(null);
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const dataFetchedRef = useRef(false); // Add ref to track if we've already fetched data

  // Add filter state
  const [filterType, setFilterType] = useState<"ALL" | "MCQ" | "CODING">("ALL");

  // Load assessment data into atom if not already there
  useEffect(() => {
    if (initialData && (!assessment || assessment.id !== initialData.id)) {
      setAssessment(initialData);
    }
  }, [initialData, assessment, assessmentId, setAssessment]);

  // Fetch all submissions for this assessment
  useEffect(() => {
    // Prevent multiple fetches
    if (dataFetchedRef.current) return;

    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        dataFetchedRef.current = true; // Mark data as being fetched

        const response = await fetch(
          `/api/submissions/assessment?assessmentId=${assessmentId}&studentId=${studentId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch submissions");
        }

        const responseData = await response.json();

        // Extract submissions array from the response
        const submissionsData = responseData.submissions || [];
        setSubmissions(submissionsData);

        // Store stats if available
        if (responseData.stats) {
          setStats(responseData.stats);
        }

        // Fetch attempt info from the database
        try {
          const attemptResponse = await fetch(
            `/api/attempt?assessmentId=${assessmentId}&studentId=${studentId}`
          );

          if (attemptResponse.ok) {
            const attemptData = await attemptResponse.json();

            if (attemptData.data) {
              const attempt = attemptData.data;
              // Use responseData.stats instead of the state variable to avoid dependency cycle
              setAttemptInfo({
                startTime: attempt.startTime,
                endTime: attempt.endTime || new Date().toISOString(),
                duration: responseData.stats?.duration || 0,
                isCompleted: attempt.isCompleted,
              });
            }
          }
        } catch (error) {
          console.error("Error fetching attempt info:", error);
        }

        // Calculate total score
        let earnedScore = 0;
        let possibleScore = 0;

        if (assessment) {
          console.log("Calculating scores for assessment:", assessment.title);
          console.log("Total problems:", assessment.problems.length);

          assessment.problems.forEach((problem) => {
            // Find the matching submission
            const submission = submissionsData.find(
              (s: { problemId: string }) => s.problemId === problem.id
            );

            // Add to possible score - Only count problems with defined scores
            const problemScore = problem.score || 0;
            possibleScore += problemScore;

            // Add to earned score if there's a successful submission
            if (submission) {
              // For MCQ problems, check isCorrect flag
              if (problem.questionType === "MULTIPLE_CHOICE") {
                earnedScore += submission.isCorrect ? problemScore : 0;
                console.log(
                  `MCQ Problem: ${problem.title}, Score: ${
                    submission.isCorrect ? problemScore : 0
                  }/${problemScore}`
                );
              }
              // For coding problems, use submission score
              else if (problem.questionType === "CODING") {
                earnedScore += submission.score || 0;
                console.log(
                  `Coding Problem: ${problem.title}, Score: ${
                    submission.score || 0
                  }/${problemScore}`
                );
              }
            } else {
              console.log(
                `No submission for problem: ${problem.title}, Possible score: ${problemScore}`
              );
            }
          });
        }

        console.log(
          `Total score calculation: ${earnedScore}/${possibleScore} (${
            possibleScore > 0 ? (earnedScore / possibleScore) * 100 : 0
          }%)`
        );

        // If we have stats from the API, use those scores as they're more reliable
        if (responseData.stats && responseData.stats.totalScore !== undefined) {
          console.log(
            `Using server-calculated scores: ${responseData.stats.totalScore}/${responseData.stats.maxScore}`
          );
          setTotalScore(responseData.stats.totalScore);
          setMaxScore(responseData.stats.maxScore);
          setPercentage(
            responseData.stats.maxScore > 0
              ? (responseData.stats.totalScore / responseData.stats.maxScore) *
                  100
              : 0
          );
        } else {
          // Fall back to client-side calculation
          console.log(
            `Using client-calculated scores: ${earnedScore}/${possibleScore}`
          );
          setTotalScore(earnedScore);
          setMaxScore(possibleScore);
          setPercentage(
            possibleScore > 0 ? (earnedScore / possibleScore) * 100 : 0
          );
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
        // If API fails, we'll fall back to localStorage in another effect
      } finally {
        setIsLoading(false);
      }
    };

    if (assessmentId && studentId) {
      fetchSubmissions();
    }
  }, [assessmentId, studentId, assessment]); // Remove stats from the dependency array

  useEffect(() => {
    if (!isLoading && submissions.length > 0 && assessment) {
      // Calculate some stats
      const problemsAttempted = submissions.length;
      const problemsCompleted = submissions.filter(
        (sub) => sub.status === "PASSED" || sub.isCorrect
      ).length;

      // Calculate total time taken
      const duration = attemptInfo?.duration || 0;

      // Calculate coding vs MCQ scores
      const codingSubmissions = submissions.filter(
        (sub) => sub.code !== undefined
      );
      const mcqSubmissions = submissions.filter(
        (sub) => sub.selectedChoiceId !== undefined
      );

      const codingScore = codingSubmissions.reduce(
        (acc, sub) => acc + (sub.score || 0),
        0
      );
      const mcqScore = mcqSubmissions.reduce(
        (acc, sub) => acc + (sub.score || 0),
        0
      );

      setStats({
        duration,
        totalScore,
        maxScore,
        problemsAttempted,
        problemsCompleted,
        codingScore,
        mcqScore,
      });
    }
  }, [
    isLoading,
    submissions.length,
    assessment,
    attemptInfo,
    totalScore,
    maxScore,
  ]);

  // Need to load all submissions from localStorage if API fails
  useEffect(() => {
    if (submissions.length === 0 && !isLoading && assessment) {
      loadSubmissionsFromLocalStorage();
    }
  }, [isLoading, submissions.length, assessment]);

  // Need to load all submissions from localStorage if API fails
  const loadSubmissionsFromLocalStorage = () => {
    if (submissions.length > 0 || !assessment) return;

    console.log("Loading submissions from localStorage as API fetch failed");
    const localSubmissions: SubmissionResult[] = [];
    let totalEarnedScore = 0;
    let totalPossibleScore = 0;

    assessment.problems.forEach((problem) => {
      const storageKey = `assessment_code_${assessment.id}_${problem.id}`;
      const savedData = localStorage.getItem(storageKey);

      // Add problem score to possible total
      const problemScore = problem.score || 0;
      totalPossibleScore += problemScore;
      console.log(`Problem: ${problem.title}, Possible score: ${problemScore}`);

      if (savedData) {
        try {
          const submission = JSON.parse(savedData) as ProblemSubmission;

          // Calculate score based on problem type
          let earnedScore = 0;

          if (problem.questionType === "MULTIPLE_CHOICE") {
            // For MCQ, check if submission has correct answer selected
            if (submission.isCorrect) {
              earnedScore = problemScore;
            }
            console.log(
              `MCQ submission for ${problem.title}, Earned: ${earnedScore}/${problemScore}`
            );
          } else if (problem.questionType === "CODING" && submission.results) {
            // For coding problems, calculate score based on test results
            if (submission.results.status === "PASSED") {
              earnedScore = problemScore;
            } else if (
              submission.results.testsPassed &&
              submission.results.totalTests
            ) {
              // Partial credit - calculate based on passed vs total tests
              earnedScore = Math.round(
                (submission.results.testsPassed /
                  submission.results.totalTests) *
                  problemScore
              );
            }
            console.log(
              `Coding submission for ${problem.title}, Earned: ${earnedScore}/${problemScore}`
            );
          }

          totalEarnedScore += earnedScore;

          localSubmissions.push({
            id: `local-${problem.id}`, // Add required id field
            studentId: studentId, // Add required studentId field
            problemId: problem.id,
            code: submission.code,
            language: submission.language,
            status: submission.results?.status || "UNKNOWN",
            score: earnedScore,
            isCorrect: submission.isCorrect || false,
            testResults: submission.results
              ? {
                  passed: submission.results.testsPassed || 0,
                  total: submission.results.totalTests || 1,
                  results: [
                    {
                      testCaseId: "local-test",
                      passed: submission.results.status === "PASSED",
                      expectedOutput: "",
                      actualOutput: submission.results.output || "",
                      isHidden: false,
                    },
                  ],
                }
              : undefined,
            createdAt: submission.lastSaved,
            submittedAt: submission.lastSaved,
            questionNumber: submission.questionNumber,
            questionPreview: submission.questionPreview,
          });
        } catch (error) {
          console.error("Error parsing local submission:", error);
        }
      }
    });

    console.log(
      `Local storage total score: ${totalEarnedScore}/${totalPossibleScore}`
    );

    if (localSubmissions.length > 0) {
      setSubmissions(localSubmissions);
      setTotalScore(totalEarnedScore);
      setMaxScore(totalPossibleScore);
      setPercentage(
        totalPossibleScore > 0
          ? (totalEarnedScore / totalPossibleScore) * 100
          : 0
      );

      // Update stats as well for consistency
      setStats({
        totalScore: totalEarnedScore,
        maxScore: totalPossibleScore,
        problemsAttempted: localSubmissions.length,
        problemsCompleted: localSubmissions.filter(
          (s) => s.testResults?.passed === s.testResults?.total || s.isCorrect
        ).length,
      });
    }
  };

  if (isLoading || !assessment) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading assessment results...</p>
        </div>
      </div>
    );
  }

  // Calculate time taken
  const calculateTimeTaken = () => {
    // If we have stats with duration field, use that
    if (stats && typeof stats.duration === "number" && stats.duration > 0) {
      console.log("Using stats duration:", stats.duration);

      // Don't use suspicious values (default 120 minutes)
      if (Math.abs(stats.duration - 120) < 5) {
        console.log(
          "Suspicious duration detected (close to 120 minutes), recalculating"
        );

        // Fallback to calculating from attempt tracker
        if (attemptInfo?.startTime && attemptInfo?.endTime) {
          try {
            const startTime = new Date(attemptInfo.startTime);
            const endTime = new Date(attemptInfo.endTime);
            const diffMs = endTime.getTime() - startTime.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            // Make sure the duration is reasonable (less than 3 hours)
            if (diffMins >= 0 && diffMins < 180) {
              const diffHrs = Math.floor(diffMins / 60);
              const remainingMins = diffMins % 60;
              console.log("Recalculated duration:", diffMins, "minutes");
              return diffHrs > 0
                ? `${diffHrs}h ${remainingMins}m`
                : `${remainingMins}m`;
            }
          } catch (error) {
            console.error("Error calculating time from timestamps:", error);
          }
        }
      }

      // Use stats duration if not suspicious
      const minutes = stats.duration;
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;
    }

    // Fallback to calculating from start/end times
    if (attemptInfo?.startTime && attemptInfo?.endTime) {
      try {
        const startTime = new Date(attemptInfo.startTime);
        const endTime = new Date(attemptInfo.endTime);

        // Validate dates before calculation
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.error("Invalid date format in attempt info:", {
            startTime: attemptInfo.startTime,
            endTime: attemptInfo.endTime,
          });
          return "N/A";
        }

        const diffMs = endTime.getTime() - startTime.getTime();

        // If negative time difference or unusually large, something is wrong
        if (diffMs < 0 || diffMs > 24 * 60 * 60 * 1000) {
          console.error("Invalid time difference:", diffMs);
          return "N/A";
        }

        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;

        return diffHrs > 0
          ? `${diffHrs}h ${remainingMins}m`
          : `${remainingMins}m`;
      } catch (error) {
        console.error("Error calculating time taken:", error);
        return "N/A";
      }
    }

    return "N/A";
  };

  // Find submission for a specific problem
  const getSubmissionForProblem = (problemId: string) => {
    return submissions.find((s) => s.problemId === problemId) || null;
  };

  // Function to generate a readable preview of the question text
  const getQuestionPreview = (description: string, maxLength: number = 50) => {
    // Strip HTML tags
    const textOnly = description.replace(/<[^>]*>/g, "");

    // Trim and truncate to specified length
    const trimmed = textOnly.trim();
    if (trimmed.length <= maxLength) return trimmed;

    return trimmed.substring(0, maxLength) + "...";
  };

  // Helper to format dates safely
  const formatDate = (dateStr: string | Date): string => {
    if (!dateStr) return "Not available";
    try {
      const date = new Date(dateStr);
      // Check if date is valid
      if (isNaN(date.getTime())) return "Not available";
      return date.toLocaleString();
    } catch (error: unknown) {
      console.error("Error formatting date:", error);
      return "Not available";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0d1424] shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Assessment Results
              </h1>
              <p className="text-sm text-gray-400 mt-1">{assessment.title}</p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="py-2 px-4 flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-md text-gray-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg shadow-lg border border-blue-900/50 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Section */}
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-900/50 border border-gray-800/50">
              <Trophy className="w-10 h-10 text-yellow-400 mb-2" />
              <div className="text-3xl font-bold text-white mb-1">
                {totalScore}/{maxScore}
              </div>
              <div className="text-sm text-gray-400">Total Score</div>
              <div className="mt-2 text-gray-400 text-sm">
                ({percentage.toFixed(1)}%)
              </div>
            </div>

            {/* Time Taken */}
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-900/50 border border-gray-800/50">
              <Clock className="w-10 h-10 text-blue-400 mb-2" />
              <div className="text-3xl font-bold text-white mb-1">
                {calculateTimeTaken()}
              </div>
              <div className="text-sm text-gray-400">Time Taken</div>
              <div className="mt-2 text-gray-400 text-sm">
                {attemptInfo?.isCompleted ? "Completed" : "Time Expired"}
              </div>
            </div>

            {/* Problems Attempted */}
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-900/50 border border-gray-800/50">
              <Code className="w-10 h-10 text-cyan-400 mb-2" />
              <div className="text-3xl font-bold text-white mb-1">
                {submissions.length}/{assessment.problems.length}
              </div>
              <div className="text-sm text-gray-400">Problems Attempted</div>
              <div className="mt-2 text-gray-400 text-sm">
                {
                  submissions.filter(
                    (s) => s.testResults?.passed === s.testResults?.total
                  ).length
                }{" "}
                Solved Correctly
              </div>
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="bg-[#0d1424] rounded-lg shadow-lg border border-gray-800/40 overflow-hidden mb-8">
          <div className="border-b border-gray-800/40 px-6 py-4">
            <h2 className="text-lg font-medium text-white">Problem Results</h2>
          </div>

          <div className="divide-y divide-gray-800/40">
            {assessment.problems.map((problem) => {
              const submission = getSubmissionForProblem(problem.id);
              return (
                <div
                  key={problem.id}
                  className="py-4 px-6 border-b border-gray-800/40 grid grid-cols-12 gap-4"
                >
                  <div className="col-span-6">
                    <h3 className="font-medium text-white mb-1">
                      {problem.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm">
                      {problem.questionType === "CODING" &&
                        problem.difficulty && (
                          <span
                            className={`px-2 py-0.5 rounded ${
                              problem.difficulty === "Easy"
                                ? "bg-green-900/20 text-green-400 border border-green-800/30"
                                : problem.difficulty === "Medium"
                                ? "bg-yellow-900/20 text-yellow-400 border border-yellow-800/30"
                                : "bg-red-900/20 text-red-400 border border-red-800/30"
                            }`}
                          >
                            {problem.difficulty}
                          </span>
                        )}
                      {problem.questionType === "MULTIPLE_CHOICE" && (
                        <span className="px-2 py-0.5 rounded bg-purple-900/20 text-purple-400 border border-purple-800/30">
                          MCQ
                        </span>
                      )}
                      <span className="text-gray-400">
                        {problem.score}{" "}
                        {problem.score === 1 ? "point" : "points"}
                      </span>
                    </div>
                    {problem.questionType === "MULTIPLE_CHOICE" && (
                      <div className="mt-2 text-xs text-gray-400 italic">
                        {getQuestionPreview(problem.description)}
                      </div>
                    )}
                  </div>
                  <div className="col-span-3 flex items-center">
                    {submission ? (
                      problem.questionType === "CODING" ? (
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                submission.testResults &&
                                submission.testResults.passed > 0
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              } mr-2`}
                            ></span>
                            <span className="text-sm">
                              {submission.testResults
                                ? `${submission.testResults.passed}/${submission.testResults.total} tests passed`
                                : "No results"}
                            </span>
                          </div>
                          {submission.executionTime && (
                            <div className="text-xs text-gray-500">
                              {submission.executionTime}ms
                            </div>
                          )}
                        </div>
                      ) : (
                        // MCQ display
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                submission.isCorrect
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              } mr-2`}
                            ></span>
                            <span className="text-sm">
                              {submission.isCorrect ? "Correct" : "Incorrect"}
                            </span>
                          </div>
                          {/* Show chosen option instead of duplicating the question */}
                          {submission.selectedChoiceId && (
                            <div className="mt-1 text-xs text-gray-400">
                              Selected:{" "}
                              {problem.choices?.find(
                                (choice) =>
                                  choice.id === submission.selectedChoiceId
                              )?.text || "Unknown option"}
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <span className="text-gray-500 text-sm">
                        Not attempted
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 flex items-center">
                    {submission ? (
                      <div className="text-sm">
                        <div>
                          Score:{" "}
                          <span className="text-white font-medium">
                            {submission.score || 0} / {problem.score}
                          </span>
                        </div>
                        {/* Submission date display */}
                        <div className="text-xs text-gray-500">
                          Submitted {formatDate(submission.submittedAt)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">No score</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Feedback */}
        <div className="bg-[#0d1424] rounded-lg shadow-lg border border-gray-800/40 overflow-hidden">
          <div className="border-b border-gray-800/40 px-6 py-4">
            <h2 className="text-lg font-medium text-white">
              Performance Summary
            </h2>
          </div>

          <div className="p-6">
            <div
              className={`p-4 rounded-lg ${
                percentage >= 70
                  ? "bg-green-900/20 border border-green-800/40"
                  : percentage >= 60
                  ? "bg-yellow-900/20 border border-yellow-800/40"
                  : "bg-red-900/20 border border-red-800/40"
              }`}
            >
              <h3
                className={`text-lg font-medium mb-2 ${
                  percentage >= 70
                    ? "text-green-400"
                    : percentage >= 60
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {percentage >= 70
                  ? "Great job!"
                  : percentage >= 60
                  ? "Good effort!"
                  : "Keep practicing!"}
              </h3>

              <p className="text-gray-300">
                {percentage >= 70
                  ? "You've demonstrated a strong understanding of the concepts tested in this assessment."
                  : percentage >= 60
                  ? "You've shown a good grasp of most concepts, but there's still room for improvement."
                  : "This assessment identified some areas where you need additional practice and understanding."}
              </p>

              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Completion</span>
                  <span className="text-sm text-white">
                    {Math.round(
                      (submissions.length / assessment.problems.length) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        (submissions.length / assessment.problems.length) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Correctness</span>
                  <span className="text-sm text-white">
                    {submissions.length > 0
                      ? Math.round(
                          (submissions.filter(
                            (s) =>
                              s.testResults?.passed === s.testResults?.total
                          ).length /
                            submissions.length) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        submissions.length > 0
                          ? (submissions.filter(
                              (s) =>
                                s.testResults?.passed === s.testResults?.total
                            ).length /
                              submissions.length) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add a new section for detailed view of submissions */}
        {submissions.length > 0 && (
          <div className="mt-8 bg-[#0d1424] rounded-lg shadow-lg border border-gray-800/40 overflow-hidden">
            <div className="border-b border-gray-800/40 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">
                Detailed Submission Review
              </h2>

              {/* Filter controls */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">Filter:</span>
                <div className="flex rounded-md overflow-hidden">
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${
                      filterType === "ALL"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                    onClick={() => setFilterType("ALL")}
                  >
                    All
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${
                      filterType === "MCQ"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                    onClick={() => setFilterType("MCQ")}
                  >
                    MCQ
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs font-medium ${
                      filterType === "CODING"
                        ? "bg-cyan-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                    onClick={() => setFilterType("CODING")}
                  >
                    Coding
                  </button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-800/40">
              {/* Group MCQ questions first */}
              {filterType !== "CODING" && (
                <div className={filterType === "MCQ" ? "" : "mb-6"}>
                  {filterType === "MCQ" && (
                    <div className="px-6 py-3 bg-purple-900/20 border-b border-purple-800/30">
                      <h3 className="text-sm font-medium text-purple-400">
                        Multiple Choice Questions
                      </h3>
                    </div>
                  )}

                  {assessment.problems
                    .filter(
                      (problem) => problem.questionType === "MULTIPLE_CHOICE"
                    )
                    .map((problem) => {
                      const submission = getSubmissionForProblem(problem.id);
                      if (!submission) return null;

                      return (
                        <div
                          key={`detail-mcq-${problem.id}`}
                          className="p-6 border-b border-gray-800/40"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-white flex items-center">
                                <span className="mr-2">{problem.title}</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-800/30">
                                  MCQ
                                </span>
                              </h3>
                              <p className="text-sm text-gray-400 mt-1">
                                {getQuestionPreview(problem.description, 200)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">
                                {submission.score || 0} / {problem.score}
                              </div>
                              <div className="text-xs text-gray-400">
                                Submitted: {formatDate(submission.submittedAt)}
                              </div>
                            </div>
                          </div>

                          {/* MCQ details section */}
                          {problem.choices && (
                            <div className="mt-6 bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-white mb-3">
                                Multiple Choice Options
                              </h4>
                              <div className="space-y-2">
                                {problem.choices.map((choice) => (
                                  <div
                                    key={choice.id}
                                    className={`flex items-start p-3 rounded-md ${
                                      submission.selectedChoiceId ===
                                        choice.id && choice.isCorrect
                                        ? "bg-green-900/20 border border-green-800/40"
                                        : submission.selectedChoiceId ===
                                            choice.id && !choice.isCorrect
                                        ? "bg-red-900/20 border border-red-800/40"
                                        : choice.isCorrect
                                        ? "bg-green-900/10 border border-green-800/20"
                                        : "bg-gray-800/20 border border-gray-700/30"
                                    }`}
                                  >
                                    <div className="mr-3 mt-0.5">
                                      {submission.selectedChoiceId ===
                                      choice.id ? (
                                        <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                                          <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                        </div>
                                      ) : (
                                        <div className="h-4 w-4 rounded-full border border-gray-600"></div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm text-gray-200">
                                        {choice.text}
                                      </div>
                                    </div>
                                    {choice.isCorrect && (
                                      <div className="ml-2 text-green-400 text-xs uppercase font-semibold bg-green-900/30 rounded px-2 py-1">
                                        Correct
                                      </div>
                                    )}
                                    {submission.selectedChoiceId ===
                                      choice.id &&
                                      !choice.isCorrect && (
                                        <div className="ml-2 text-red-400 text-xs uppercase font-semibold bg-red-900/30 rounded px-2 py-1">
                                          Your Selection
                                        </div>
                                      )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Then coding questions */}
              {filterType !== "MCQ" && (
                <div>
                  {filterType === "CODING" && (
                    <div className="px-6 py-3 bg-blue-900/20 border-b border-blue-800/30">
                      <h3 className="text-sm font-medium text-blue-400">
                        Coding Questions
                      </h3>
                    </div>
                  )}

                  {assessment.problems
                    .filter((problem) => problem.questionType === "CODING")
                    .map((problem) => {
                      const submission = getSubmissionForProblem(problem.id);
                      if (!submission) return null;

                      return (
                        <div
                          key={`detail-coding-${problem.id}`}
                          className="p-6 border-b border-gray-800/40"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-white flex items-center">
                                <span className="mr-2">{problem.title}</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-800/30">
                                  Coding
                                </span>
                                {problem.difficulty && (
                                  <span
                                    className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      problem.difficulty === "Easy"
                                        ? "bg-green-900/20 text-green-400 border border-green-800/30"
                                        : problem.difficulty === "Medium"
                                        ? "bg-yellow-900/20 text-yellow-400 border border-yellow-800/30"
                                        : "bg-red-900/20 text-red-400 border border-red-800/30"
                                    }`}
                                  >
                                    {problem.difficulty}
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-400 mt-1">
                                {getQuestionPreview(problem.description, 200)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">
                                {submission.score || 0} / {problem.score}
                              </div>
                              <div className="text-xs text-gray-400">
                                Submitted: {formatDate(submission.submittedAt)}
                              </div>
                            </div>
                          </div>

                          {/* Coding details section */}
                          {submission.code && (
                            <div className="mt-6">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium text-white">
                                  Code Submission
                                </h4>
                                <div className="text-xs text-gray-400">
                                  Language:{" "}
                                  <span className="text-cyan-400 font-mono">
                                    {submission.language}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-gray-900/70 border border-gray-800/50 rounded-lg overflow-hidden">
                                <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700/30 flex justify-between items-center">
                                  <div className="font-mono text-xs text-gray-400">
                                    Submitted Solution
                                  </div>
                                  {submission.executionTime && (
                                    <div className="flex items-center text-xs text-gray-400 space-x-4">
                                      <span>
                                        Execution:{" "}
                                        <span className="text-cyan-400">
                                          {submission.executionTime}ms
                                        </span>
                                      </span>
                                      {submission.memoryUsed && (
                                        <span>
                                          Memory:{" "}
                                          <span className="text-cyan-400">
                                            {submission.memoryUsed}KB
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
                                  <code>{submission.code}</code>
                                </pre>
                              </div>

                              {/* Test results */}
                              {submission.testResults &&
                                submission.testResults.results && (
                                  <div className="mt-4">
                                    <h4 className="text-sm font-medium text-white mb-2">
                                      Test Results
                                    </h4>
                                    <div className="space-y-2">
                                      {submission.testResults.results.map(
                                        (test, index) => (
                                          <div
                                            key={`test-${index}`}
                                            className={`bg-gray-900/30 border rounded-md p-3 ${
                                              test.passed
                                                ? "border-green-800/40"
                                                : "border-red-800/40"
                                            }`}
                                          >
                                            <div className="flex justify-between mb-2">
                                              <div className="text-sm font-medium">
                                                <span
                                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                                    test.passed
                                                      ? "bg-green-900/20 text-green-400"
                                                      : "bg-red-900/20 text-red-400"
                                                  }`}
                                                >
                                                  {test.passed
                                                    ? "Passed"
                                                    : "Failed"}
                                                </span>
                                              </div>
                                              <div className="text-xs text-gray-400">
                                                Test Case #{index + 1}
                                              </div>
                                            </div>

                                            {!test.isHidden && (
                                              <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                                                <div>
                                                  <div className="text-gray-400 mb-1">
                                                    Input:
                                                  </div>
                                                  <div className="bg-gray-800/50 p-2 rounded font-mono whitespace-pre-wrap">
                                                    {"Input data not available"}
                                                  </div>
                                                </div>
                                                <div className="space-y-2">
                                                  <div>
                                                    <div className="text-gray-400 mb-1">
                                                      Expected:
                                                    </div>
                                                    <div className="bg-gray-800/50 p-2 rounded font-mono whitespace-pre-wrap">
                                                      {test.expectedOutput ||
                                                        "N/A"}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="text-gray-400 mb-1">
                                                      Actual:
                                                    </div>
                                                    <div
                                                      className={`bg-gray-800/50 p-2 rounded font-mono whitespace-pre-wrap ${
                                                        !test.passed
                                                          ? "text-red-400"
                                                          : ""
                                                      }`}
                                                    >
                                                      {test.actualOutput ||
                                                        "N/A"}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {test.isHidden && (
                                              <div className="text-xs text-gray-400 italic mt-1">
                                                This is a hidden test case.
                                                Details are not displayed.
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
