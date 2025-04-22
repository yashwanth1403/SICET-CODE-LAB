"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitSolution, finalizeAssessment } from "@/actions/CreateAssessment";
import { useAssessment } from "@/lib/store/context/AssessmentContext";
import { TestAssessmentType } from "@/lib/store/atom/testAssessment";

interface AssessmentProblemProps {
  studentId: string;
  assessmentId: string;
  problemId: string;
  initialData: TestAssessmentType | null;
}

export const OngoingAssessment: React.FC<AssessmentProblemProps> = ({
  studentId,
  assessmentId,
  problemId,
  initialData,
}) => {
  const router = useRouter();
  const { assessment, setAssessment } = useAssessment();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize assessment atom with initial data if not already set
  useEffect(() => {
    if (initialData && !assessment) {
      setAssessment(initialData);
    }
  }, [initialData, assessment, setAssessment]);

  const problem = assessment?.problems.find((p) => p.id === problemId);
  const problemLanguage = problem?.languages?.find((l) => l.name === language);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoice(choiceId);
  };

  const handleSubmit = async () => {
    if (!problem) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let submitResult: { success: boolean; error?: string };

      if (problem.questionType === "CODING") {
        // Submit coding solution
        if (!code.trim()) {
          throw new Error("Please write your code before submitting");
        }

        submitResult = await submitSolution(
          studentId,
          problemId,
          code,
          language
        );
      } else if (problem.questionType === "MULTIPLE_CHOICE") {
        // Submit multiple choice answer
        if (!selectedChoice) {
          throw new Error("Please select an answer before submitting");
        }

        submitResult = await submitSolution(
          studentId,
          problemId,
          undefined,
          undefined,
          selectedChoice
        );
      } else {
        throw new Error("Unknown question type");
      }

      if (!submitResult?.success) {
        throw new Error(submitResult?.error || "Failed to submit solution");
      }

      setSuccess("Solution submitted successfully!");

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/assessment/ongoing/${assessmentId}`);
      }, 1500);
    } catch (err) {
      // Error handling without logging
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during submission"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      const result = await finalizeAssessment(studentId, assessmentId);

      if (!result.success) {
        throw new Error(result.error || "Failed to finalize assessment");
      }

      // Clear localStorage data except attempt info
      clearLocalStorageExceptAttemptInfo(assessmentId);

      router.push(`/assessment/completed/${assessmentId}`);
    } catch (err) {
      // Error handling without logging
      setError(
        err instanceof Error ? err.message : "Failed to finalize assessment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to clear localStorage data except attempt info
  const clearLocalStorageExceptAttemptInfo = (assessmentId: string) => {
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
  };

  if (!assessment || !problem) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading problem...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-5xl mx-auto bg-gray-800 rounded-lg overflow-hidden shadow-xl">
        {/* Problem Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl text-white font-semibold">
              {problem.title ||
                (problem.questionType === "MULTIPLE_CHOICE"
                  ? "Multiple Choice Question"
                  : "")}
            </h1>
            <div className="flex space-x-4 items-center">
              {problem.questionType === "CODING" && problem.difficulty && (
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    problem.difficulty === "Easy"
                      ? "bg-green-900 text-green-200"
                      : problem.difficulty === "Medium"
                      ? "bg-yellow-900 text-yellow-200"
                      : "bg-red-900 text-red-200"
                  }`}
                >
                  {problem.difficulty}
                </span>
              )}
              {problem.questionType === "MULTIPLE_CHOICE" && (
                <span className="px-3 py-1 rounded-full text-sm bg-purple-900 text-purple-200">
                  Multiple Choice
                </span>
              )}
              <span className="text-sm text-blue-300">
                {problem.score} {problem.score === 1 ? "point" : "points"}
              </span>
            </div>
          </div>
          <div className="prose text-gray-300 max-w-none">
            <div dangerouslySetInnerHTML={{ __html: problem.description }} />
          </div>
        </div>

        {/* Based on question type, show different interfaces */}
        {problem.questionType === "CODING" ? (
          /* Code Editor for Coding Problems */
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <label htmlFor="language" className="text-gray-400 mr-2">
                  Language:
                </label>
                <select
                  id="language"
                  className="bg-gray-700 text-white rounded-md px-3 py-1 border-none focus:ring-2 focus:ring-blue-500"
                  value={language}
                  onChange={handleLanguageChange}
                >
                  {problem.languages?.map((lang) => (
                    <option key={lang.id} value={lang.name}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg overflow-hidden mb-4">
              <div className="bg-gray-700 px-4 py-2 text-gray-300">
                <code>{problemLanguage?.functionSignature}</code>
              </div>
              <textarea
                className="w-full bg-gray-900 text-gray-100 p-4 font-mono text-sm h-96 focus:outline-none"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={
                  problemLanguage?.starterCode || "Write your code here..."
                }
              ></textarea>
            </div>
          </div>
        ) : (
          /* Multiple Choice Interface */
          <div className="p-6">
            <h3 className="text-white text-lg mb-4">
              Select the correct answer:
            </h3>
            <div className="space-y-3">
              {problem.choices?.map((choice) => (
                <div
                  key={choice.id}
                  className={`p-4 rounded-lg cursor-pointer border-2 ${
                    selectedChoice === choice.id
                      ? "border-blue-500 bg-blue-900/20"
                      : "border-gray-700 bg-gray-800 hover:bg-gray-700"
                  }`}
                  onClick={() => handleChoiceSelect(choice.id)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center border-2 ${
                        selectedChoice === choice.id
                          ? "border-blue-500"
                          : "border-gray-500"
                      }`}
                    >
                      {selectedChoice === choice.id && (
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <p className="text-gray-200">{choice.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="px-6 py-3 bg-red-900/50 text-red-200 border-t border-red-800">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="px-6 py-3 bg-green-900/50 text-green-200 border-t border-green-800">
            <p>{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 bg-gray-800 border-t border-gray-700 flex justify-between">
          <button
            className="px-4 py-2 text-gray-400 hover:text-white bg-transparent"
            onClick={() => router.push(`/assessment/ongoing/${assessmentId}`)}
          >
            Back to Assessment
          </button>
          <div className="space-x-4">
            <button
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <button
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              onClick={handleFinish}
              disabled={isSubmitting}
            >
              Finish Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
