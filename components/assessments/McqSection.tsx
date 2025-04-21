"use client";
import React, { useCallback, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { CheckCircle, Loader } from "lucide-react";

interface McqAnswer {
  problemId: string;
  selectedChoiceId: string;
  isSubmitted: boolean;
  isCorrect?: boolean; // Make optional since we won't show correctness
  score?: number; // Make optional since we won't show scores
  questionNumber: number;
  questionPreview: string;
}

interface McqProblem {
  id: string;
  question: string;
  choices: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  score: number;
}

interface McqSectionProps {
  assessmentId: string;
  mcqProblems: McqProblem[];
  studentId: string;
}

const McqSection: React.FC<McqSectionProps> = ({
  assessmentId,
  mcqProblems,
  studentId,
}) => {
  const [answers, setAnswers] = useState<Record<string, McqAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

  // Debug log component rendering
  console.log("[MCQ] McqSection rendering with props:", {
    assessmentId,
    studentId,
    mcqProblemsCount: mcqProblems?.length,
  });

  // Load from localStorage and API
  useEffect(() => {
    const loadAnswers = async () => {
      setLoading(true);
      try {
        // First load from localStorage
        const storedAnswers: Record<string, McqAnswer> = {};

        // Try to load selections from localStorage
        mcqProblems.forEach((problem) => {
          const localStorageKey = `mcq_selection_${assessmentId}_${problem.id}`;
          const savedSelection = localStorage.getItem(localStorageKey);

          if (savedSelection) {
            try {
              const parsedSelection = JSON.parse(savedSelection);
              storedAnswers[problem.id] = {
                problemId: problem.id,
                selectedChoiceId: parsedSelection.selectedChoiceId,
                questionNumber:
                  mcqProblems.findIndex((p) => p.id === problem.id) + 1,
                questionPreview:
                  problem.question.substring(0, 50) +
                  (problem.question.length > 50 ? "..." : ""),
                isSubmitted: false,
              };
            } catch (e) {
              console.error(
                `[MCQ] Error parsing localStorage for problem ${problem.id}:`,
                e
              );
            }
          }
        });

        console.log(
          "[MCQ] Loaded selections from localStorage:",
          Object.keys(storedAnswers).length
        );

        // Then fetch submitted answers from API
        console.log("[MCQ] Fetching existing submissions from API");
        const response = await fetch(
          `/api/submissions/assessment?assessmentId=${assessmentId}&studentId=${studentId}&type=MCQ`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch submissions");
        }

        const data = await response.json();
        const submittedAnswers: Record<string, McqAnswer> = {};

        // Convert submissions to answers format for state - only track submission status
        data.submissions.forEach(
          (submission: {
            problemId: string;
            selectedChoiceId: string;
            questionNumber?: number;
            questionPreview?: string;
          }) => {
            submittedAnswers[submission.problemId] = {
              problemId: submission.problemId,
              selectedChoiceId: submission.selectedChoiceId,
              questionNumber: submission.questionNumber || 0,
              questionPreview: submission.questionPreview || "",
              isSubmitted: true, // Only track that it's submitted, not correctness
            };
          }
        );

        console.log(
          "[MCQ] Loaded submissions from API:",
          data.submissions.length
        );

        // Merge localStorage selections with API submissions (API takes precedence)
        const mergedAnswers = { ...storedAnswers, ...submittedAnswers };
        setAnswers(mergedAnswers);
      } catch (error) {
        console.error("[MCQ] Error loading answers:", error);
        toast.error("Failed to load your previous answers");
      } finally {
        setLoading(false);
      }
    };

    loadAnswers();
  }, [assessmentId, studentId, mcqProblems]);

  // Submit function - no longer shows correctness
  function handleSubmitClick() {
    console.log("[MCQ] Direct submit button clicked");
    console.log("[MCQ] Using studentId:", studentId);
    console.log("[MCQ] Using assessmentId:", assessmentId);
    console.log("[MCQ] Current answers:", answers);

    // Validate required data
    if (!studentId) {
      console.error("[MCQ] Missing studentId for submission");
      toast.error("Student ID is missing");
      return;
    }

    if (!assessmentId) {
      console.error("[MCQ] Missing assessmentId for submission");
      toast.error("Assessment ID is missing");
      return;
    }

    // Filter unsaved answers
    const unsavedAnswers = Object.values(answers).filter(
      (answer) => !answer.isSubmitted && answer.selectedChoiceId
    );

    console.log("[MCQ] Unsaved answers to submit:", unsavedAnswers);

    if (unsavedAnswers.length === 0) {
      console.log("[MCQ] No unsaved answers to submit");
      toast("No new answers to submit", {
        icon: "🔔",
        duration: 2000,
      });
      return;
    }

    // Set submitting state to true
    setSubmitting(true);

    // Process each answer
    const submissionPromises = unsavedAnswers.map(async (answer) => {
      console.log(`[MCQ] Submitting answer for problem ${answer.problemId}`);

      const response = await fetch("/api/submissions/mcq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          problemId: answer.problemId,
          selectedChoiceId: answer.selectedChoiceId,
          questionNumber: answer.questionNumber,
          questionPreview: answer.questionPreview,
        }),
      });

      console.log(`[MCQ] Response status: ${response.status}`);

      if (!response.ok) {
        const text = await response.text();
        console.error("[MCQ] Error response:", text);
        throw new Error(`Failed to submit: ${text}`);
      }

      return {
        problemId: answer.problemId,
      };
    });

    Promise.all(submissionPromises)
      .then((results) => {
        console.log("[MCQ] All submissions completed:", results);

        // Update answers with submission results - only mark as submitted
        const updatedAnswers = { ...answers };
        results.forEach(({ problemId }) => {
          updatedAnswers[problemId] = {
            ...updatedAnswers[problemId],
            isSubmitted: true,
          };

          // Remove from localStorage once submitted
          const localStorageKey = `mcq_selection_${assessmentId}_${problemId}`;
          localStorage.removeItem(localStorageKey);
        });

        setAnswers(updatedAnswers);
        toast.success(`Successfully submitted ${results.length} answers!`);
      })
      .catch((error) => {
        console.error("[MCQ] Submission process failed:", error);
        toast.error("Failed to submit answers. Please try again.");
      })
      .finally(() => {
        // Reset submitting state
        setSubmitting(false);
      });
  }

  const handleAnswerSelect = useCallback(
    (problemId: string, choiceId: string) => {
      console.log("[MCQ] Answer selected:", { problemId, choiceId });

      const problem = mcqProblems.find((p) => p.id === problemId);
      if (!problem) {
        console.error("[MCQ] Problem not found:", problemId);
        return;
      }

      const selectedChoice = problem.choices.find((c) => c.id === choiceId);
      if (!selectedChoice) {
        console.error("[MCQ] Choice not found:", choiceId);
        return;
      }

      const updatedAnswers = { ...answers };
      updatedAnswers[problemId] = {
        problemId,
        selectedChoiceId: choiceId,
        isSubmitted: false,
        questionNumber: mcqProblems.findIndex((p) => p.id === problemId) + 1,
        questionPreview:
          problem.question.substring(0, 50) +
          (problem.question.length > 50 ? "..." : ""),
      };

      // Save to localStorage
      const localStorageKey = `mcq_selection_${assessmentId}_${problemId}`;
      localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          selectedChoiceId: choiceId,
          timestamp: new Date().toISOString(),
        })
      );

      console.log("[MCQ] Saved selection to localStorage:", localStorageKey);
      console.log("[MCQ] Updating answers state:", updatedAnswers);
      setAnswers(updatedAnswers);
    },
    [mcqProblems, answers, assessmentId]
  );

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < mcqProblems.length) {
      setCurrentProblemIndex(index);
    }
  };

  const currentProblem = mcqProblems[currentProblemIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#0d1424] rounded-lg border border-gray-800/50 p-5">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">Loading MCQ questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Question navigation sidebar */}
      <div className="lg:w-1/4">
        <div className="bg-[#0d1424] rounded-lg border border-gray-800/50 p-4">
          <h3 className="text-lg font-medium text-white mb-3">Questions</h3>
          <div className="grid grid-cols-4 gap-2">
            {mcqProblems.map((problem, index) => {
              const answer = answers[problem.id];
              let buttonClass =
                "flex items-center justify-center h-10 w-10 rounded-md text-center";

              if (index === currentProblemIndex) {
                buttonClass +=
                  " bg-blue-600 text-white border-2 border-blue-400";
              } else if (answer?.isSubmitted) {
                buttonClass += " bg-blue-900/50 text-blue-200"; // Changed from green/red to neutral blue for all submitted
              } else if (answer?.selectedChoiceId) {
                buttonClass += " bg-yellow-900/50 text-yellow-200";
              } else {
                buttonClass += " bg-[#1a2234] text-gray-300 hover:bg-[#232c3f]";
              }

              return (
                <button
                  key={problem.id}
                  className={buttonClass}
                  onClick={() => navigateToQuestion(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current question */}
      <div className="lg:w-3/4 flex flex-col">
        <div className="bg-[#0d1424] rounded-lg border border-gray-800/50 p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-white">
              Question {currentProblemIndex + 1} of {mcqProblems.length}
            </h2>
            <div className="text-sm px-3 py-1 rounded-full bg-blue-900/50 text-blue-300 border border-blue-800/30">
              {currentProblem.score} points
            </div>
          </div>

          <div className="my-6">
            <div
              className="text-gray-100 text-lg mb-6 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: currentProblem.question }}
            />

            <div className="space-y-3">
              {currentProblem.choices.map((choice) => (
                <div
                  key={choice.id}
                  className={`flex items-center p-3 rounded-lg border transition-colors ${
                    answers[currentProblem.id]?.selectedChoiceId === choice.id
                      ? "bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-600"
                      : "border-gray-800/50 hover:border-gray-600"
                  }`}
                  onClick={() =>
                    handleAnswerSelect(currentProblem.id, choice.id)
                  }
                >
                  <input
                    type="radio"
                    id={`${currentProblem.id}-${choice.id}`}
                    name={currentProblem.id}
                    value={choice.id}
                    checked={
                      answers[currentProblem.id]?.selectedChoiceId === choice.id
                    }
                    onChange={() =>
                      handleAnswerSelect(currentProblem.id, choice.id)
                    }
                    className="sr-only" // Hide the default radio button
                  />
                  <label
                    htmlFor={`${currentProblem.id}-${choice.id}`}
                    className="flex items-center w-full cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 flex-shrink-0 rounded-full border mr-3 ${
                        answers[currentProblem.id]?.selectedChoiceId ===
                        choice.id
                          ? "border-purple-500 bg-gradient-to-r from-purple-500 to-indigo-500"
                          : "border-gray-600"
                      }`}
                    >
                      {answers[currentProblem.id]?.selectedChoiceId ===
                        choice.id && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <span className="text-gray-100">{choice.text}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {answers[currentProblem.id]?.isSubmitted && (
            <div className="p-4 rounded-lg mt-4 bg-blue-900/20 border border-blue-800/30">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-blue-400 font-medium">
                  Answer submitted
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#0d1424] rounded-lg border border-gray-800/50 p-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => navigateToQuestion(currentProblemIndex - 1)}
              disabled={currentProblemIndex === 0}
              className={`px-4 py-2 rounded ${
                currentProblemIndex === 0
                  ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                  : "bg-blue-900/50 text-blue-200 hover:bg-blue-800/50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => navigateToQuestion(currentProblemIndex + 1)}
              disabled={currentProblemIndex === mcqProblems.length - 1}
              className={`px-4 py-2 rounded ${
                currentProblemIndex === mcqProblems.length - 1
                  ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                  : "bg-blue-900/50 text-blue-200 hover:bg-blue-800/50"
              }`}
            >
              Next
            </button>
          </div>

          <button
            onClick={handleSubmitClick}
            type="button"
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-md hover:from-blue-700 hover:to-cyan-700 font-medium flex items-center"
            disabled={
              submitting ||
              Object.values(answers).filter(
                (a) => !a.isSubmitted && a.selectedChoiceId
              ).length === 0
            }
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Answers
                {Object.values(answers).filter(
                  (a) => !a.isSubmitted && a.selectedChoiceId
                ).length > 0 && (
                  <span className="ml-2 bg-blue-700/50 px-2 py-0.5 rounded-full text-xs">
                    {
                      Object.values(answers).filter(
                        (a) => !a.isSubmitted && a.selectedChoiceId
                      ).length
                    }
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default McqSection;
