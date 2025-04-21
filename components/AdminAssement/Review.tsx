import React from "react";
import { Assessment, IProblem } from "@/types";
import { Code, ListChecks } from "lucide-react";

interface ReviewProps {
  assessment: Assessment;
}

export const Review: React.FC<ReviewProps> = ({ assessment }) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Review Assessment</h2>

      <div className="space-y-6">
        {/* Basic Details */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-xl font-semibold text-white mb-4">
            Basic Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <p className="text-gray-400 mb-1">Title</p>
              <p className="font-medium text-white">{assessment.title}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Batch</p>
              <p className="font-medium text-white">
                {assessment.batches.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Departments</p>
              <p className="font-medium text-white">
                {assessment.departments.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Topics</p>
              <p className="font-medium text-white">
                {assessment.topics.length > 0
                  ? assessment.topics.join(", ")
                  : "No topics specified"}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-xl font-semibold text-white mb-4">Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <p className="text-gray-400 mb-1">Start Time</p>
              <p className="font-medium text-white">
                {formatDate(assessment.startTime)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">End Time</p>
              <p className="font-medium text-white">
                {formatDate(assessment.endTime)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Duration</p>
              <p className="font-medium text-white">
                {assessment.duration} minutes
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Total Questions</p>
              <p className="font-medium text-white">
                {assessment.problems.length}
              </p>
            </div>
          </div>
        </div>

        {/* Problems Overview */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-xl font-semibold text-white mb-4">Problems</h3>
          <div className="space-y-4">
            {assessment.problems.map((problem, index) => (
              <ProblemReview key={index} problem={problem} index={index} />
            ))}
          </div>
        </div>

        {/* Submission Instructions */}
        <div className="bg-blue-900/30 text-blue-200 border border-blue-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">
            Ready to create your assessment?
          </h4>
          <p>
            Click the "Create Assessment" button below to finalize and publish
            your assessment. Once created, students will be able to access it at
            the scheduled start time.
          </p>
        </div>
      </div>
    </div>
  );
};

// Component to display review of a single problem
interface ProblemReviewProps {
  problem: IProblem;
  index: number;
}

const ProblemReview: React.FC<ProblemReviewProps> = ({ problem, index }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <span className="bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1 rounded-md text-white text-sm font-medium">
          Problem {index + 1}
        </span>

        {problem.questionType === "CODING" ? (
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium 
            ${
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
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-900/50 text-purple-300">
            MCQ
          </span>
        )}

        <span className="px-2 py-1 rounded-md text-xs bg-gray-700 text-gray-300 flex items-center gap-1">
          {problem.questionType === "CODING" ? (
            <>
              <Code className="h-3 w-3" /> Coding
            </>
          ) : (
            <>
              <ListChecks className="h-3 w-3" /> Multiple Choice
            </>
          )}
        </span>
        <span className="ml-auto text-gray-400 text-sm">
          Score: {problem.score} {problem.score === 1 ? "point" : "points"}
        </span>
      </div>

      <h4 className="text-white font-medium mb-2">
        {problem.title || "Multiple Choice Question"}
      </h4>

      <div className="text-gray-400 text-sm mb-4">
        <p className="line-clamp-2">
          {problem.description.substring(0, 200)}...
        </p>
      </div>

      {problem.questionType === "CODING" ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Languages:</p>
            <p className="text-gray-300">
              {problem.languages?.map((l) => l.name).join(", ") || "None"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Test Cases:</p>
            <p className="text-gray-300">
              {problem.testCases.length} (
              {problem.testCases.filter((tc) => tc.isHidden).length} hidden,
              {problem.testCases.filter((tc) => !tc.isHidden).length} visible)
            </p>
          </div>
        </div>
      ) : (
        <div className="text-sm">
          <p className="text-gray-500 mb-1">
            Answer Choices (
            {problem.choices?.filter((c) => c.isCorrect).length || 0} correct):
          </p>
          <div className="flex flex-col space-y-1 mt-2">
            {problem.choices?.map((choice, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    choice.isCorrect ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  {choice.isCorrect && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`${
                    choice.isCorrect ? "text-green-300" : "text-gray-300"
                  } text-sm`}
                >
                  {choice.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
