"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAssessment } from "@/lib/store/context/AssessmentContext";
import { createAttemptTracker } from "@/actions/CreateAssessment";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  HelpCircle,
  SendHorizontal,
  Code,
  FileTerminal,
  LayoutDashboard,
  ListChecks,
  X,
} from "lucide-react";

// Type for attempt information
type AttemptInfo = {
  id: string;
  studentId: string;
  assessmentId: string;
  startTime: string; // ISO date string
  endTime?: string; // ISO date string (optional)
  isCompleted: boolean;
  duration?: number; // in minutes
};

// Type for legacy attempt data that might come from assessment.attemptData
type LegacyAttemptData = {
  startTime: string;
  endTime: string;
  duration: number;
  attemptId: string;
};

const TestSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const { assessment } = useAssessment();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState<AttemptInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to assessment overview if assessment is null
  useEffect(() => {
    if (!assessment) {
      // Extract assessmentId from pathname using regex
      const match = pathname.match(/assessment\/ongoing\/([^\/]+)/);
      if (match && match[1]) {
        const assessmentId = match[1];
        router.push(`/assessment/ongoing/${assessmentId}`);
      }
    }
  }, [assessment, pathname, router]);

  // Extract current problem ID from path if available
  const getCurrentProblemId = () => {
    const match = pathname.match(/problem\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const currentProblemId = getCurrentProblemId();

  // Function to clear localStorage data except attempt info
  const clearLocalStorageExceptAttemptInfo = useCallback(
    (assessmentId: string) => {
      // Error handling without logging

      try {
        // Keep track of the attempt info key
        const attemptInfoKey = `assessment_attempt_${assessmentId}`;

        // Find all keys related to this assessment
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes(assessmentId) && key !== attemptInfoKey) {
            keysToRemove.push(key);
          }
        }

        // Remove the keys
        // Error handling without logging
        keysToRemove.forEach((key) => {
          // Error handling without logging
          localStorage.removeItem(key);
        });

        // Error handling without logging
      } catch {
        // Error handling without logging
      }
    },
    []
  );

  // Handle test submission
  const handleTestSubmission = useCallback(
    async (isTimeExpired = false) => {
      if (!assessment?.id || isSubmitting) return;

      setIsSubmitting(true);

      // Function to save all unsaved work before submission
      const saveAllUnfinishedWork = () => {
        try {
          // Save any coding submissions that might not be saved yet
          assessment.problems.forEach((problem) => {
            if (problem.questionType === "CODING") {
              const storageKey = `assessment_code_${assessment.id}_${problem.id}`;
              const savedData = localStorage.getItem(storageKey);

              if (savedData) {
                // Get the latest code from localStorage
                const submission = JSON.parse(savedData);

                // If we have code but no test results, run an auto-save to the server
                if (
                  submission.code &&
                  (!submission.results || submission.results.status === "ERROR")
                ) {
                  // Attempt to save this to the server
                  fetch("/api/submissions/problem", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      problemId: problem.id,
                      assessmentId: assessment.id,
                      code: submission.code,
                      language: submission.language,
                      isAutoSave: true,
                    }),
                  }).catch(() => {
                    /* Silent fail - we're trying our best to save */
                  });
                }
              }
            }
          });
        } catch {
          // Silent fail - this is a best-effort save
        }
      };

      try {
        // First save any unsaved work
        saveAllUnfinishedWork();

        if (isTimeExpired) {
          alert("Time's up! Your assessment will be submitted automatically.");
        }

        // Submit the assessment via the API endpoint
        const response = await fetch("/api/submissions/assessment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assessmentId: assessment.id,
            isTimeExpired,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to submit assessment");
        }

        // Successfully submitted
        const result = await response.json();
        console.log("Assessment submitted successfully:", result);

        // Clear localStorage except for the attempt info
        clearLocalStorageExceptAttemptInfo(assessment.id);

        // Navigate to the completion page
        router.push(`/assessment/completed/${assessment.id}`);
      } catch (error) {
        console.error("Error submitting assessment:", error);
        alert(
          "There was an error submitting your assessment. Please try again."
        );

        // If submission failed, try again with a different approach
        if (isTimeExpired) {
          // For time expiry, we need to make sure data is saved
          try {
            // Make one final attempt to save all data
            saveAllUnfinishedWork();

            // Still try to navigate away
            router.push(`/assessment/completed/${assessment.id}`);
          } catch {
            // Final fallback - if everything else failed, just go to completed page
            router.push(`/assessment/completed/${assessment.id}`);
          }
        }
      } finally {
        setIsSubmitting(false);
        setShowConfirmation(false);
      }
    },
    [assessment, isSubmitting, router, clearLocalStorageExceptAttemptInfo]
  );

  // Fetch attempt data directly from the database
  const fetchAttemptData = useCallback(async () => {
    if (!assessment?.id) return;

    setIsLoading(true);
    try {
      // Ensure we're using the correct endpoint with proper query parameters
      const response = await fetch(
        `/api/attempt?assessmentId=${assessment.id}`
      );

      if (response.ok) {
        // Successful response - attempt exists
        const result = await response.json();

        if (result.success && result.data) {
          console.log("Attempt data fetched successfully:", result.data);
          setAttemptInfo(result.data as AttemptInfo);
          return; // Successful fetch, exit early
        }
      }

      // If we get here, either:
      // 1. Response was not OK (404 - no attempt found)
      // 2. Response was OK but data format was invalid

      // Try to get error details
      let errorMessage = "Unknown error";
      if (!response.ok) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `Error ${response.status}`;
        } catch {
          errorMessage = `HTTP Error ${response.status} ${response.statusText}`;
        }
      }

      console.log(`Attempt fetch result: ${errorMessage}`);

      // If no attempt found (404) or other issues, check if we have attempt data in the assessment object
      if (assessment.attemptData) {
        // Use the existing attempt data from assessment context
        const attemptData =
          assessment.attemptData as unknown as LegacyAttemptData;
        if (attemptData) {
          const convertedData: AttemptInfo = {
            id: attemptData.attemptId || "legacy",
            studentId: "", // Will be filled by API when needed
            assessmentId: assessment.id,
            startTime: attemptData.startTime,
            endTime: attemptData.endTime,
            isCompleted: false, // Default to false for legacy data
            duration: attemptData.duration,
          };
          setAttemptInfo(convertedData);
          return; // Successfully used fallback data
        }
      }

      // If response was specifically 404 (No attempt found), we need to create a new attempt
      if (response.status === 404) {
        console.log("No attempt found, creating a new one");
        // Try to create a new attempt tracker
        const duration = assessment.duration || 60; // Default to 60 minutes if not specified

        try {
          // First try to create attempt using server action
          console.log("Attempting to create attempt using server action");
          const result = await createAttemptTracker(
            "",
            assessment.id,
            duration
          );

          if (result.success && result.data) {
            console.log(
              "Successfully created new attempt with server action:",
              result.data
            );
            setAttemptInfo(result.data as unknown as AttemptInfo);
            return;
          } else {
            throw new Error(result.error || "Failed to create attempt tracker");
          }
        } catch (error) {
          console.error("Error creating attempt with server action:", error);

          // If server action fails, try using the API endpoint directly
          try {
            console.log("Attempting to create attempt using API endpoint");
            const apiResponse = await fetch("/api/attempt", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                assessmentId: assessment.id,
                duration: duration,
              }),
            });

            if (apiResponse.ok) {
              const apiResult = await apiResponse.json();
              if (apiResult.success && apiResult.data) {
                console.log(
                  "Successfully created new attempt with API:",
                  apiResult.data
                );
                setAttemptInfo(apiResult.data as unknown as AttemptInfo);
                return;
              }
            }

            // If API also fails, throw error to continue to local fallback
            const errorData = await apiResponse.json().catch(() => ({
              error: `${apiResponse.status} ${apiResponse.statusText}`,
            }));
            throw new Error(`API error: ${errorData.error || "Unknown error"}`);
          } catch (apiError) {
            console.error("Error creating attempt with API:", apiError);
            const errorMessage =
              apiError instanceof Error ? apiError.message : "Unknown error";
            console.warn(
              `Failed to create attempt with all methods: ${errorMessage}`
            );

            // Create a local fallback attempt if all server methods fail
            console.log("Creating local fallback attempt");
            const now = new Date();
            const endTime = new Date(now.getTime() + duration * 60 * 1000); // duration in minutes

            const fallbackAttempt: AttemptInfo = {
              id: "local-fallback",
              studentId: "",
              assessmentId: assessment.id,
              startTime: now.toISOString(),
              endTime: endTime.toISOString(),
              isCompleted: false,
              duration: duration,
            };

            setAttemptInfo(fallbackAttempt);
            return;
          }
        }
      }

      // If we have no valid attempt data from any source, throw an error that will be caught below
      throw new Error(errorMessage);
    } catch (error) {
      console.error("Error fetching attempt data:", error);

      // At this point, both the API fetch and the assessment.attemptData fallback have failed
      // The component will show the loading state until a valid attempt is established

      // As a last resort, create a completely local attempt
      if (assessment) {
        const duration = assessment.duration || 60;
        const now = new Date();
        const endTime = new Date(now.getTime() + duration * 60 * 1000);

        const emergencyFallback: AttemptInfo = {
          id: "emergency-fallback",
          studentId: "",
          assessmentId: assessment.id,
          startTime: now.toISOString(),
          endTime: endTime.toISOString(),
          isCompleted: false,
          duration: duration,
        };

        console.warn(
          "Using emergency fallback attempt due to all other methods failing"
        );
        setAttemptInfo(emergencyFallback);
      }
    } finally {
      setIsLoading(false);
    }
  }, [assessment?.id, assessment?.attemptData, assessment?.duration]);

  // Initialize and update timer based on attempt data from database
  useEffect(() => {
    if (!assessment || !assessment.id) return;

    // Fetch attempt data when component mounts
    fetchAttemptData();
  }, [assessment, fetchAttemptData]);

  // Set up timer based on attempt data
  useEffect(() => {
    if (!attemptInfo || isLoading || !assessment) return;

    // Flag to prevent multiple auto-submissions
    let hasTriggeredAutoSubmit = false;

    // Calculate time remaining
    const updateTimeRemaining = () => {
      const now = new Date();
      const endTime = new Date(attemptInfo.endTime || "");
      const startTime = new Date(attemptInfo.startTime);
      const totalDuration = assessment.duration || attemptInfo.duration || 0; // in minutes
      const totalDurationSeconds = totalDuration * 60; // in seconds

      // Calculate remaining time in seconds
      const remainingMs = endTime.getTime() - now.getTime();
      const remainingSecs = Math.max(0, Math.floor(remainingMs / 1000));

      // Calculate elapsed percentage
      const elapsedMs = now.getTime() - startTime.getTime();
      const totalMs = totalDurationSeconds * 1000;
      const elapsedPercentage = Math.min(100, (elapsedMs / totalMs) * 100);

      setTimeRemaining(remainingSecs);
      setProgress(elapsedPercentage);

      // Auto-submit when time expires, but only once
      if (remainingSecs <= 0 && !hasTriggeredAutoSubmit) {
        hasTriggeredAutoSubmit = true;

        // Create auto-submit indicator in localStorage
        try {
          localStorage.setItem(`assessment_timed_out_${assessment.id}`, "true");
        } catch {}

        // Trigger auto-submission
        handleTestSubmission(true);
      }

      // Early warning at 1 minute remaining
      if (remainingSecs > 0 && remainingSecs <= 60 && !hasTriggeredAutoSubmit) {
        // Show 1-minute warning
        const warningKey = `assessment_warning_${assessment.id}`;
        const hasShownWarning = localStorage.getItem(warningKey);

        if (!hasShownWarning) {
          // Set warning shown flag
          localStorage.setItem(warningKey, "true");

          // Show warning alert
          alert(
            "Warning: You have less than 1 minute remaining. Your assessment will be automatically submitted when time expires."
          );
        }
      }
    };

    // Initial update
    updateTimeRemaining();

    // Update every second
    const timer = setInterval(updateTimeRemaining, 1000);

    // Emergency auto-submit function (backup if first submission fails)
    const emergencyAutoSubmit = () => {
      if (!assessment) return;

      const now = new Date();
      const endTime = new Date(attemptInfo.endTime || "");

      // Check if we're at least 5 seconds past the end time
      if (now.getTime() > endTime.getTime() + 5000) {
        // Check if we have auto-submit indicator
        const hasTimedOut = localStorage.getItem(
          `assessment_timed_out_${assessment.id}`
        );

        // Check for completion status from the attempt data
        const isCompleted = attemptInfo.isCompleted;

        // If timed out but not completed, try submission again
        if (hasTimedOut && !isCompleted && !hasTriggeredAutoSubmit) {
          hasTriggeredAutoSubmit = true;
          handleTestSubmission(true);
        }
      }
    };

    // Check every 5 seconds as a backup to ensure submission happens
    const emergencyTimer = setInterval(emergencyAutoSubmit, 5000);

    // Clean up
    return () => {
      clearInterval(timer);
      clearInterval(emergencyTimer);
    };
  }, [assessment, handleTestSubmission, attemptInfo, isLoading]);

  // Format time remaining as HH:MM:SS or MM:SS
  const formatTimeRemaining = () => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Navigate to problem
  const navigateToProblem = (problemId: string) => {
    if (assessment) {
      router.push(`/assessment/ongoing/${assessment.id}/problem/${problemId}`);
    }
  };

  // Show confirmation modal
  const showSubmitConfirmation = () => {
    setShowConfirmation(true);
  };

  // Return to assessment overview
  const navigateToOverview = () => {
    if (assessment) {
      router.push(`/assessment/ongoing/${assessment.id}`);
    }
  };

  // Get status icon for a problem
  const getStatusIcon = (problem: { id: string; questionType?: string }) => {
    if (problem.questionType === "MULTIPLE_CHOICE") {
      return getMcqStatusIcon(problem.id);
    }

    // Try to get the problem submission from localStorage
    const storageKey = `assessment_code_${assessment?.id}_${problem.id}`;
    let status = "PENDING";

    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const submission = JSON.parse(savedData);
        if (submission.results) {
          // Use the status from submission results
          if (submission.results.status === "PASSED") {
            status = "COMPLETED";
          } else if (submission.results.status === "FAILED") {
            status = "FAILED";
          } else if (submission.results.status === "ERROR") {
            status = "ERROR";
          } else if (
            submission.results.testsPassed &&
            submission.results.testsPassed > 0
          ) {
            // Partial success (some tests passed, but not all)
            status =
              submission.results.testsPassed === submission.results.totalTests
                ? "COMPLETED"
                : "FAILED";
          }
        }
      }
    } catch {
      // Error handling without logging
    }

    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case "ERROR":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "RUNNING":
        return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
      case "PENDING":
      default:
        return null;
    }
  };

  // Get status icon for MCQ problems
  const getMcqStatusIcon = (problemId: string) => {
    // Try to get the MCQ submission from localStorage
    const storageKey = `assessment_mcq_${assessment?.id}_${problemId}`;
    let status = "PENDING";

    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const submission = JSON.parse(savedData);
        if (submission.selectedChoiceId) {
          // If we have a selected choice, mark as completed
          status = submission.isSubmitted ? "COMPLETED" : "PENDING";

          // If we have isCorrect info (from results/completion) use that
          if (submission.isCorrect === true) {
            status = "COMPLETED";
          } else if (submission.isCorrect === false) {
            status = "FAILED";
          }
        }
      }
    } catch {
      // Error handling without logging
    }

    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-rose-500" />;
      case "PENDING":
      default:
        return null;
    }
  };

  // Get difficulty indicator
  const getDifficultyIndicator = (difficulty?: string) => {
    if (!difficulty) return null;

    switch (difficulty.toLowerCase()) {
      case "easy":
        return (
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
        );
      case "medium":
        return <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>;
      case "hard":
        return <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span>;
      default:
        return null;
    }
  };

  // Filter problems based on search query
  const filteredProblems =
    assessment?.problems.filter(
      (problem) =>
        // Only include CODING problems, filter by search query
        problem.questionType === "CODING" &&
        problem.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Handle loading state
  if (!assessment || isLoading) {
    return (
      <div className="fixed top-0 left-0 w-16 h-screen bg-[#0d1424] border-r border-gray-800 z-10">
        <div className="w-full h-full flex flex-col items-center justify-center">
          <Loader className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  // Count total coding problems and solved coding problems
  const totalCodingProblems = assessment.problems.filter(
    (p) => p.questionType === "CODING"
  ).length;
  const solvedCodingProblems = assessment.problems.filter(
    (p) =>
      p.questionType === "CODING" && p.submission?.results?.status === "PASSED"
  ).length;

  return (
    <div
      className={`fixed top-0 left-0 h-screen ${
        expanded ? "w-72" : "w-16"
      } bg-[#0d1424] border-r border-gray-800/40 transition-all duration-300 flex flex-col z-50 shadow-xl`}
      style={{ borderRight: "none" }}
    >
      {/* Header with toggle */}
      <div className="border-b border-gray-800/40 p-4 flex items-center justify-between">
        {expanded ? (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <FileTerminal className="w-4 h-4 text-white" />
            </div>
            <div className="ml-2">
              <h2 className="font-semibold text-sm bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent truncate max-w-40">
                {assessment.title || "Assessment"}
              </h2>
              <p className="text-xs text-gray-400">Coding Challenge</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <FileTerminal className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        {expanded ? (
          <button
            className="w-7 h-7 rounded-md hover:bg-gray-800/60 transition-colors flex items-center justify-center"
            onClick={() => setExpanded(false)}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
        ) : (
          <button
            className="fixed left-12 top-4 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors flex items-center justify-center shadow-md z-50"
            onClick={() => setExpanded(true)}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        )}
      </div>

      {/* Timer Block - Always visible */}
      {expanded ? (
        <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-b border-gray-800/40">
          <div className="flex items-center justify-between mb-2">
            {timeRemaining < 300 ? (
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-rose-400 mr-2 animate-pulse" />
                <span className="text-rose-400 font-medium">
                  Time Remaining
                </span>
              </div>
            ) : (
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-gray-300 font-medium">
                  Time Remaining
                </span>
              </div>
            )}
            <span
              className={`text-sm font-mono ${
                timeRemaining < 300 ? "text-rose-400" : "text-white"
              }`}
            >
              {formatTimeRemaining()}
            </span>
          </div>
          <div className="w-full bg-gray-800/70 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                progress > 75
                  ? "bg-gradient-to-r from-rose-500 to-red-600"
                  : progress > 50
                  ? "bg-gradient-to-r from-amber-500 to-orange-600"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500"
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Started</span>
            <span>{Math.floor(progress)}% elapsed</span>
          </div>
        </div>
      ) : (
        <div className="py-3 flex items-center justify-center bg-gray-800/70 border-b border-gray-800/40">
          <Clock className="w-6 h-4 text-blue-400 mr-1" />
          <span className={`text-sm font-mono text-white`}>
            {formatTimeRemaining()}
          </span>
        </div>
      )}

      {/* Search bar - only show if expanded */}
      {expanded && (
        <div className="px-3 py-2 border-b border-gray-800/40">
          <div className="relative">
            <input
              type="text"
              placeholder="Search coding problems..."
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md py-1.5 px-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                onClick={() => setSearchQuery("")}
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Problems section with custom scrollbar */}
      <div className="flex-grow overflow-hidden relative">
        {expanded ? (
          <div className="flex justify-between items-center px-4 py-2 bg-gray-900/50">
            <p className="text-xs text-gray-400 font-medium">
              Coding Problems ({filteredProblems.length})
            </p>
            <div className="flex items-center">
              <Code className="w-3 h-3 text-gray-400 mr-1" />
              <span className="text-xs text-gray-400">
                {solvedCodingProblems}/{totalCodingProblems} Solved
              </span>
            </div>
          </div>
        ) : null}

        {/* Custom scrollbar container */}
        <div
          className="h-full overflow-y-auto scrollbar-container px-3 py-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#4B5563 #1F2937",
          }}
        >
          <style jsx global>{`
            .scrollbar-container::-webkit-scrollbar {
              width: 4px;
            }

            .scrollbar-container::-webkit-scrollbar-track {
              background: #1f2937;
              border-radius: 10px;
            }

            .scrollbar-container::-webkit-scrollbar-thumb {
              background: #4b5563;
              border-radius: 10px;
            }

            .scrollbar-container::-webkit-scrollbar-thumb:hover {
              background: #6b7280;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            .animate-fade-in {
              animation: fadeIn 0.2s ease-out forwards;
            }
          `}</style>

          <div
            className={`${
              expanded ? "space-y-2" : "space-y-3 flex flex-col items-center"
            }`}
          >
            {/* Overview button */}
            <button
              className={`
                ${
                  expanded
                    ? "w-full flex items-center p-2.5"
                    : "w-10 h-10 flex items-center justify-center"
                }
                rounded-md text-white
                ${
                  !currentProblemId
                    ? "bg-gradient-to-r from-blue-600/50 to-cyan-600/50 shadow-md shadow-blue-900/20"
                    : "bg-gray-800/70 hover:bg-gray-700/70 hover:shadow-md"
                }
                transition-all
              `}
              onClick={navigateToOverview}
            >
              {expanded ? (
                <div className="flex items-center w-full">
                  <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-blue-900/60 text-xs font-medium text-blue-400">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  </div>
                  <span className="ml-2 text-sm font-medium">Overview</span>
                </div>
              ) : (
                <LayoutDashboard className="w-5 h-5 text-blue-400" />
              )}
            </button>

            {/* MCQ Section Button - only show if there are MCQ problems */}
            {assessment?.problems.some(
              (p) => p.questionType === "MULTIPLE_CHOICE"
            ) && (
              <button
                className={`
                  ${
                    expanded
                      ? "w-full flex items-center p-2.5"
                      : "w-10 h-10 flex items-center justify-center"
                  }
                  rounded-md text-white
                  bg-gradient-to-r from-purple-600/50 to-blue-600/50 hover:from-purple-700/50 hover:to-blue-700/50 shadow-md shadow-purple-900/20
                  transition-all
                `}
                onClick={() =>
                  router.push(`/assessment/ongoing/${assessment.id}/mcq`)
                }
              >
                {expanded ? (
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-purple-900/60 text-xs font-medium text-purple-400">
                      <ListChecks className="w-3.5 h-3.5" />
                    </div>
                    <span className="ml-2 text-sm font-medium">
                      MCQ Section
                    </span>
                    <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-purple-900/80 text-purple-200">
                      {
                        assessment.problems.filter(
                          (p) => p.questionType === "MULTIPLE_CHOICE"
                        ).length
                      }
                    </span>
                  </div>
                ) : (
                  <ListChecks className="w-5 h-5 text-purple-400" />
                )}
              </button>
            )}

            {/* Coding Problems Section Header */}
            {expanded && (
              <div className="px-4 py-2 text-xs text-gray-400 font-medium">
                Coding Problems
              </div>
            )}

            {/* Problems list */}
            {filteredProblems.map((problem, index) => (
              <button
                key={problem.id}
                className={`
                  ${
                    expanded
                      ? "w-full flex items-center p-2.5"
                      : "w-10 h-10 flex items-center justify-center"
                  }
                  rounded-md text-white
                  ${
                    problem.id === currentProblemId
                      ? "bg-gradient-to-r from-blue-700/30 to-cyan-700/30 border border-blue-500/30 shadow-md shadow-blue-900/10"
                      : "bg-gray-800/70 hover:bg-gray-700/70 hover:border hover:border-gray-700/50"
                  }
                  transition-all
                `}
                onClick={() => navigateToProblem(problem.id)}
                aria-label={`Problem ${index + 1}`}
              >
                {expanded ? (
                  <div className="flex items-center w-full">
                    <div
                      className={`relative flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full ${
                        problem.questionType === "MULTIPLE_CHOICE"
                          ? "bg-purple-700/80"
                          : "bg-gray-700/80"
                      } text-xs font-medium`}
                    >
                      {index + 1}
                    </div>
                    <div className="ml-2 flex items-center">
                      {problem.questionType === "CODING" &&
                        getDifficultyIndicator(problem.difficulty)}
                      {problem.questionType === "MULTIPLE_CHOICE" && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm truncate max-w-32 font-medium">
                          {problem.title}
                        </span>
                        <span className="text-xs text-gray-400">
                          {problem.questionType === "CODING"
                            ? "Coding Problem"
                            : "Multiple Choice"}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto">{getStatusIcon(problem)}</div>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center w-full h-full">
                    <span
                      className={`text-xs ${
                        problem.questionType === "MULTIPLE_CHOICE"
                          ? "text-purple-300"
                          : ""
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="absolute -top-1 -right-1">
                      {getStatusIcon(problem)}
                    </div>
                  </div>
                )}
              </button>
            ))}

            {filteredProblems.length === 0 && searchQuery && expanded && (
              <div className="text-center py-4 text-gray-400 text-sm">
                No problems match your search
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-gray-800/40 bg-gray-900/30">
        <button
          className={`w-full flex items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium shadow-md shadow-blue-900/10 transition-all ${
            expanded ? "px-4 py-2.5" : "py-2.5"
          } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
          onClick={showSubmitConfirmation}
          disabled={isSubmitting}
          aria-label="Submit assessment"
        >
          {expanded ? (
            <>
              {isSubmitting ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <SendHorizontal className="w-4 h-4 mr-2" />
              )}
              <span>
                {isSubmitting ? "Submitting..." : "Submit Assessment"}
              </span>
            </>
          ) : isSubmitting ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <SendHorizontal className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Help button */}
      <div className="p-4 pt-2">
        <button
          className={`w-full flex items-center justify-center rounded-md bg-gray-800/80 hover:bg-gray-700/80 transition-colors text-gray-300 text-sm ${
            expanded ? "px-4 py-2.5" : "py-2.5"
          }`}
          aria-label="Get help"
        >
          {expanded ? (
            <>
              <HelpCircle className="w-4 h-4 mr-2" />
              <span>Need Help?</span>
            </>
          ) : (
            <HelpCircle className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0d1424] border border-gray-700 rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Submit Assessment
              </h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Are you sure you want to submit your assessment? Once submitted,
                you will not be able to make any further changes.
              </p>

              {/* Submission Status */}
              <div className="space-y-3 mb-4">
                <div className="bg-yellow-900/30 text-yellow-300 border border-yellow-800/50 rounded-md p-3 flex items-start">
                  <AlertTriangle className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm">
                    Please ensure you have saved all your answers before
                    submitting. Unsaved work may be lost.
                  </span>
                </div>

                <div className="bg-blue-900/30 text-blue-300 border border-blue-800/50 rounded-md p-3 flex items-start">
                  <CheckCircle className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm space-y-1 w-full">
                    <p>
                      <strong>Assessment:</strong>{" "}
                      {assessment?.title || "Coding Test"}
                    </p>
                    <p>
                      <strong>Timer Status:</strong> {Math.floor(progress)}%
                      complete
                    </p>

                    {/* Progress summary */}
                    <div className="mt-2 pt-2 border-t border-blue-800/30">
                      <p className="font-medium">Completion Status:</p>
                      <div className="mt-1 flex flex-col gap-1.5">
                        {(() => {
                          // Calculate stats for this summary
                          const codingProblems =
                            assessment?.problems.filter(
                              (p) => p.questionType === "CODING"
                            ) || [];
                          const mcqProblems =
                            assessment?.problems.filter(
                              (p) => p.questionType === "MULTIPLE_CHOICE"
                            ) || [];

                          // Count attempted problems
                          let codingAttempted = 0;
                          let mcqAttempted = 0;

                          // Check coding problems
                          codingProblems.forEach((problem) => {
                            try {
                              const storageKey = `assessment_code_${assessment?.id}_${problem.id}`;
                              const savedData =
                                localStorage.getItem(storageKey);
                              if (savedData) {
                                const submission = JSON.parse(savedData);
                                if (submission.code) codingAttempted++;
                              }
                            } catch {}
                          });

                          // Check MCQ problems
                          mcqProblems.forEach((problem) => {
                            try {
                              const storageKey = `assessment_mcq_${assessment?.id}_${problem.id}`;
                              const savedData =
                                localStorage.getItem(storageKey);
                              if (savedData) {
                                const submission = JSON.parse(savedData);
                                if (submission.selectedChoiceId) mcqAttempted++;
                              }
                            } catch {}
                          });

                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <span>Coding problems:</span>
                                <span>
                                  {codingAttempted}/{codingProblems.length}{" "}
                                  attempted
                                </span>
                              </div>
                              {mcqProblems.length > 0 && (
                                <div className="flex justify-between items-center">
                                  <span>MCQ problems:</span>
                                  <span>
                                    {mcqAttempted}/{mcqProblems.length}{" "}
                                    attempted
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center font-medium">
                                <span>Total:</span>
                                <span>
                                  {codingAttempted + mcqAttempted}/
                                  {assessment?.problems.length || 0} attempted
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleTestSubmission(false)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-md shadow-md shadow-blue-900/10 transition-colors flex items-center justify-center min-w-[120px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 inline animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>Submit Assessment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSidebar;
