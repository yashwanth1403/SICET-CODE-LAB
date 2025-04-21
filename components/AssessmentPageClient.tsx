"use client";

import { useState, useEffect } from "react";
import { AssessmentOverview } from "@/components/test/AssessmentOverview";
import { createAttemptTracker } from "@/actions/CreateAssessment";
export default function AssessmentPageClient({ initialData, session }) {
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [assessment, setAssessment] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [attemptData, setAttemptData] = useState(null);

  // Check for existing attempt in localStorage on component mount
  useEffect(() => {
    const storedAttempt = localStorage.getItem(
      `assessment_attempt_${initialData.id}`
    );

    if (storedAttempt) {
      const parsedAttempt = JSON.parse(storedAttempt);
      setAttemptData(parsedAttempt);

      // If we have a stored attempt, skip confirmation screen
      setShowConfirmation(false);
    }
  }, [initialData.id]);

  const handleStartAssessment = async () => {
    setIsLoading(true);
    try {
      // Create attempt tracker when user confirms
      const result = await createAttemptTracker(
        session.user.id,
        initialData.id,
        initialData.duration
      );

      if (result.success && result.data && result.data.endTime) {
        // Store attempt data in localStorage
        const now = result.data?.startTime;
        const endTime = result.data?.endTime; // Convert minutes to milliseconds

        console.log(now, endTime);

        const attemptInfo = {
          startTime: now.toISOString(),
          endTime: endTime.toISOString(),
          duration: initialData.duration,
          attemptId: result.data.id,
        };

        localStorage.setItem(
          `assessment_attempt_${initialData.id}`,
          JSON.stringify(attemptInfo)
        );
        setAttemptData(attemptInfo);

        // Hide confirmation dialog and show assessment
        setShowConfirmation(false);
      } else {
        // If we get a success: true but with message "Existing attempt found", it means there's an existing attempt
        if (result.message === "Existing attempt found") {
          const existingAttempt = result.data;

          // Calculate the end time based on start time and duration
          const startTime = new Date(existingAttempt.startTime);
          const endTime = new Date(
            startTime.getTime() + initialData.duration * 60000
          );

          const attemptInfo = {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: initialData.duration,
            attemptId: existingAttempt.id,
          };

          localStorage.setItem(
            `assessment_attempt_${initialData.id}`,
            JSON.stringify(attemptInfo)
          );
          setAttemptData(attemptInfo);

          // Skip confirmation since there's an existing attempt
          setShowConfirmation(false);
        } else {
          console.error("Failed to start assessment:", result.error);
        }
      }
    } catch (error) {
      console.error("Error starting assessment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialData) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-gray-100 flex items-center justify-center">
        Loading assessment...
      </div>
    );
  }

  return (
    <>
      {showConfirmation ? (
        <div className="min-h-screen bg-[#0a0f1a] text-gray-100 flex items-center justify-center">
          <div className="bg-[#0d1424] p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Start Assessment: {initialData.title}
            </h2>

            <div className="mb-6 text-gray-300">
              <p className="mb-4">
                You are about to start this assessment. Please note:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li>The timer will begin immediately after confirmation</li>
                <li>
                  This assessment has a duration of {initialData.duration}{" "}
                  minutes
                </li>
                <li>You cannot pause the assessment once started</li>
                <li>Ensure you have a stable internet connection</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                className={`bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-md font-medium transition-all ${
                  isLoading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:from-blue-600 hover:to-cyan-600"
                }`}
                onClick={handleStartAssessment}
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Start Assessment"}
              </button>

              <button
                className="bg-transparent border border-gray-600 text-gray-300 py-3 px-6 rounded-md font-medium hover:bg-gray-800 transition-all"
                onClick={() => window.history.back()}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <AssessmentOverview
          id={initialData.id}
          initialData={{
            ...initialData,
            attemptData: attemptData,
          }}
        />
      )}
    </>
  );
}
