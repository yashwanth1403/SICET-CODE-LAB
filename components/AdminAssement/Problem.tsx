import { Plus } from "lucide-react";
import { X } from "lucide-react";
import { Assessment, ValidationErrors } from "@/types";
import type {
  IProblem,
  ITestCase,
  IProblemLanguage,
  ProgrammingLanguage,
  UpdateTestCaseFunction,
  UpdateLanguageFunction,
  UpdateChoiceFunction,
  IQuestionChoice,
  QuestionType,
} from "@/types";
import { useState, useEffect } from "react";
import { fetchProfessorProblems } from "@/actions/CreateAssessment";
import { Wrench } from "lucide-react";

interface ProblemsAndTestCasesProps {
  assessment: Assessment;
  addProblem: (questionType?: QuestionType) => void;
  removeProblem: (problemIndex: number) => void;
  updateProblem: (
    problemIndex: number,
    field: keyof IProblem,
    value: string | number | QuestionType
  ) => void;
  addTestCase: (problemIndex: number) => void;
  removeTestCase: (problemIndex: number, testCaseIndex: number) => void;
  updateTestCase: UpdateTestCaseFunction;
  addLanguage: (problemIndex: number) => void;
  removeLanguage: (problemIndex: number, languageIndex: number) => void;
  updateLanguage: UpdateLanguageFunction;
  addChoice: (problemIndex: number) => void;
  removeChoice: (problemIndex: number, choiceIndex: number) => void;
  updateChoice: UpdateChoiceFunction;
  replaceProblem: (problemIndex: number, newProblem: IProblem) => void;
  errors: ValidationErrors;
  professorId: string;
  fixTestCases?: (problemIndex: number) => void;
  fixAllProblems?: () => void;
}

interface ProblemProps {
  problem: IProblem;
  problemIndex: number;
  updateProblem: (
    problemIndex: number,
    field: keyof IProblem,
    value: string | number | QuestionType
  ) => void;
  removeProblem: (problemIndex: number) => void;
  addTestCase: (problemIndex: number) => void;
  removeTestCase: (problemIndex: number, testCaseIndex: number) => void;
  updateTestCase: UpdateTestCaseFunction;
  addLanguage: (problemIndex: number) => void;
  removeLanguage: (problemIndex: number, languageIndex: number) => void;
  updateLanguage: UpdateLanguageFunction;
  addChoice: (problemIndex: number) => void;
  removeChoice: (problemIndex: number, choiceIndex: number) => void;
  updateChoice: UpdateChoiceFunction;
  errors: ValidationErrors;
  fixTestCases?: (problemIndex: number) => void;
}

interface TestCaseProps {
  testCase: ITestCase;
  testCaseIndex: number;
  problemIndex: number;
  updateTestCase: UpdateTestCaseFunction;
  removeTestCase: (problemIndex: number, testCaseIndex: number) => void;
  errors: ValidationErrors;
}

interface LanguageProps {
  language: IProblemLanguage;
  languageIndex: number;
  problemIndex: number;
  updateLanguage: UpdateLanguageFunction;
  removeLanguage: (problemIndex: number, languageIndex: number) => void;
  errors: ValidationErrors;
}

// Test Case Component
export const TestCase: React.FC<TestCaseProps> = ({
  testCase,
  testCaseIndex,
  problemIndex,
  updateTestCase,
  removeTestCase,
  errors,
}) => {
  const hasInputError =
    !!errors[`problem${problemIndex}TestCase${testCaseIndex}Input`];
  const hasOutputError =
    !!errors[`problem${problemIndex}TestCase${testCaseIndex}Output`];
  const hasError = hasInputError || hasOutputError;

  return (
    <div
      className={`p-5 bg-gray-750 rounded-lg border ${
        hasError ? "border-red-500" : "border-gray-700"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <span
          className={`font-medium ${
            testCase.isHidden ? "text-yellow-400" : "text-blue-400"
          }`}
        >
          {testCase.isHidden ? "Hidden Test Case" : "Visible Test Case"}{" "}
          {testCaseIndex + 1}
        </span>
        <button
          onClick={() => removeTestCase(problemIndex, testCaseIndex)}
          className="text-gray-400 hover:text-red-400 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Test Input{" "}
            {hasInputError && (
              <span className="text-red-500 ml-1">(Required)</span>
            )}
          </label>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 ${
              hasInputError ? "border border-red-500" : ""
            }`}
            rows={3}
            placeholder="Input for this test case"
            value={testCase.input}
            onChange={(e) =>
              updateTestCase(
                problemIndex,
                testCaseIndex,
                "input",
                e.target.value
              )
            }
          />
          {hasInputError && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`problem${problemIndex}TestCase${testCaseIndex}Input`]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Expected Output{" "}
            {hasOutputError && (
              <span className="text-red-500 ml-1">(Required)</span>
            )}
          </label>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 ${
              hasOutputError ? "border border-red-500" : ""
            }`}
            rows={3}
            placeholder="Expected output"
            value={testCase.output}
            onChange={(e) =>
              updateTestCase(
                problemIndex,
                testCaseIndex,
                "output",
                e.target.value
              )
            }
          />
          {hasOutputError && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`problem${problemIndex}TestCase${testCaseIndex}Output`]}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <label className="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            className="rounded bg-gray-700"
            checked={testCase.isHidden}
            onChange={(e) =>
              updateTestCase(
                problemIndex,
                testCaseIndex,
                "isHidden",
                e.target.checked
              )
            }
          />
          Hidden Test Case
        </label>
      </div>
    </div>
  );
};

// Multiple Choice Component
interface ChoiceProps {
  choice: IQuestionChoice;
  choiceIndex: number;
  problemIndex: number;
  updateChoice: UpdateChoiceFunction;
  removeChoice: (problemIndex: number, choiceIndex: number) => void;
  errors: ValidationErrors;
}

export const MultipleChoiceComponent: React.FC<ChoiceProps> = ({
  choice,
  choiceIndex,
  problemIndex,
  updateChoice,
  removeChoice,
  errors,
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-3">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-white">Choice {choiceIndex + 1}</h5>
        <button
          onClick={() => removeChoice(problemIndex, choiceIndex)}
          className="text-gray-400 hover:text-white"
          type="button"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-4 items-start">
        <div className="flex-grow">
          <input
            type="text"
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 ${
              errors[`problem${problemIndex}Choice${choiceIndex}Text`]
                ? "border-red-500"
                : ""
            }`}
            placeholder="Enter choice text"
            value={choice.text}
            onChange={(e) =>
              updateChoice(problemIndex, choiceIndex, "text", e.target.value)
            }
          />
          {errors[`problem${problemIndex}Choice${choiceIndex}Text`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`problem${problemIndex}Choice${choiceIndex}Text`]}
            </p>
          )}
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 text-gray-400">
            <input
              type="radio"
              className="rounded-full bg-gray-700 border-gray-500 focus:ring-blue-500"
              checked={choice.isCorrect}
              onChange={() =>
                updateChoice(problemIndex, choiceIndex, "isCorrect", true)
              }
            />
            Correct Answer
          </label>
        </div>
      </div>
    </div>
  );
};

// Language Component
export const LanguageComponent: React.FC<LanguageProps> = ({
  language,
  languageIndex,
  problemIndex,
  updateLanguage,
  removeLanguage,
  errors,
}) => {
  const languages: ProgrammingLanguage[] = [
    "C",
    "C++",
    "Java",
    "Python",
    "JavaScript",
    "TypeScript",
    "Ruby",
    "Go",
    "Rust",
  ];

  // Helper function to get default code snippets based on language
  const getDefaultCodeSnippets = (languageName: ProgrammingLanguage) => {
    switch (languageName) {
      case "Python":
        return {
          functionSignature: "def solution(input_data):",
          codePrefix:
            "# This code runs before the student's code\n\ndef solution(input_data):\n",
          starterCode: "    # Your Python solution here\n    return None",
          codeSuffix:
            "\n\n# This code runs after the student's code\ninput_data = input()\nprint(solution(input_data))",
        };
      case "Java":
        return {
          functionSignature: "public static String solution(String input)",
          codePrefix:
            "import java.util.*;\n\npublic class Solution {\n    public static String solution(String input) {",
          starterCode:
            "        // Your Java solution here\n        return null;",
          codeSuffix:
            "    }\n\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        String input = scanner.nextLine();\n        System.out.println(solution(input));\n    }\n}",
        };
      case "JavaScript":
        return {
          functionSignature: "function solution(input)",
          codePrefix:
            "// This code runs before the student's code\n\nfunction solution(input) {",
          starterCode: "    // Your JavaScript solution here\n    return null;",
          codeSuffix:
            "}\n\n// This code runs after the student's code\nconst input = readline();\nconsole.log(solution(input));",
        };
      case "C++":
        return {
          functionSignature: "string solution(string input)",
          codePrefix:
            "#include <iostream>\n#include <string>\nusing namespace std;\n\nstring solution(string input) {",
          starterCode: '    // Your C++ solution here\n    return "";',
          codeSuffix:
            "}\n\nint main() {\n    string input;\n    getline(cin, input);\n    cout << solution(input) << endl;\n    return 0;\n}",
        };
      // Add more languages as needed
      default:
        return {
          functionSignature: "function solution(input)",
          codePrefix: "// Code prefix",
          starterCode: "// Starter code",
          codeSuffix: "// Code suffix",
        };
    }
  };

  // Handle language change to auto-update code snippets
  const handleLanguageChange = (newLanguage: ProgrammingLanguage) => {
    const defaultSnippets = getDefaultCodeSnippets(newLanguage);

    // Update language name
    updateLanguage(problemIndex, languageIndex, "name", newLanguage);

    // Update other fields with default values for the selected language
    updateLanguage(
      problemIndex,
      languageIndex,
      "functionSignature",
      defaultSnippets.functionSignature
    );
    updateLanguage(
      problemIndex,
      languageIndex,
      "codePrefix",
      defaultSnippets.codePrefix
    );
    updateLanguage(
      problemIndex,
      languageIndex,
      "starterCode",
      defaultSnippets.starterCode
    );
    updateLanguage(
      problemIndex,
      languageIndex,
      "codeSuffix",
      defaultSnippets.codeSuffix
    );
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-white">Language {languageIndex + 1}</h5>
        <button
          onClick={() => removeLanguage(problemIndex, languageIndex)}
          className="text-gray-400 hover:text-white"
          type="button"
        >
          <X size={16} />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Programming Language
          </label>
          <select
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 ${
              errors[`problem${problemIndex}Language${languageIndex}Name`]
                ? "border-red-500"
                : ""
            }`}
            value={language.name}
            onChange={(e) =>
              handleLanguageChange(e.target.value as ProgrammingLanguage)
            }
          >
            <option value="" disabled>
              Select a language
            </option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          {errors[`problem${problemIndex}Language${languageIndex}Name`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`problem${problemIndex}Language${languageIndex}Name`]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Function Signature
          </label>
          <input
            type="text"
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 font-mono ${
              errors[
                `problem${problemIndex}Language${languageIndex}FunctionSignature`
              ]
                ? "border-red-500"
                : ""
            }`}
            placeholder={`Function signature for ${
              language.name || "selected language"
            }`}
            value={language.functionSignature}
            onChange={(e) =>
              updateLanguage(
                problemIndex,
                languageIndex,
                "functionSignature",
                e.target.value
              )
            }
          />
          {errors[
            `problem${problemIndex}Language${languageIndex}FunctionSignature`
          ] && (
            <p className="text-red-500 text-sm mt-1">
              {
                errors[
                  `problem${problemIndex}Language${languageIndex}FunctionSignature`
                ]
              }
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Code Prefix
          </label>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 font-mono ${
              errors[`problem${problemIndex}Language${languageIndex}CodePrefix`]
                ? "border-red-500"
                : ""
            }`}
            rows={4}
            placeholder={`Code that appears before the student's code for ${
              language.name || "selected language"
            }`}
            value={language.codePrefix}
            onChange={(e) =>
              updateLanguage(
                problemIndex,
                languageIndex,
                "codePrefix",
                e.target.value
              )
            }
          />
          {errors[
            `problem${problemIndex}Language${languageIndex}CodePrefix`
          ] && (
            <p className="text-red-500 text-sm mt-1">
              {
                errors[
                  `problem${problemIndex}Language${languageIndex}CodePrefix`
                ]
              }
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Starter Code
          </label>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 font-mono ${
              errors[
                `problem${problemIndex}Language${languageIndex}StarterCode`
              ]
                ? "border-red-500"
                : ""
            }`}
            rows={6}
            placeholder={`Template code visible to students for ${
              language.name || "selected language"
            }`}
            value={language.starterCode}
            onChange={(e) =>
              updateLanguage(
                problemIndex,
                languageIndex,
                "starterCode",
                e.target.value
              )
            }
          />
          {errors[
            `problem${problemIndex}Language${languageIndex}StarterCode`
          ] && (
            <p className="text-red-500 text-sm mt-1">
              {
                errors[
                  `problem${problemIndex}Language${languageIndex}StarterCode`
                ]
              }
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Code Suffix
          </label>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 font-mono ${
              errors[`problem${problemIndex}Language${languageIndex}CodeSuffix`]
                ? "border-red-500"
                : ""
            }`}
            rows={4}
            placeholder={`Code that appears after the student's code for ${
              language.name || "selected language"
            }`}
            value={language.codeSuffix}
            onChange={(e) =>
              updateLanguage(
                problemIndex,
                languageIndex,
                "codeSuffix",
                e.target.value
              )
            }
          />
          {errors[
            `problem${problemIndex}Language${languageIndex}CodeSuffix`
          ] && (
            <p className="text-red-500 text-sm mt-1">
              {
                errors[
                  `problem${problemIndex}Language${languageIndex}CodeSuffix`
                ]
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Problem: React.FC<ProblemProps> = ({
  problem,
  problemIndex,
  updateProblem,
  removeProblem,
  addTestCase,
  removeTestCase,
  updateTestCase,
  addLanguage,
  removeLanguage,
  updateLanguage,
  addChoice,
  removeChoice,
  updateChoice,
  errors,
  fixTestCases,
}) => {
  // Helper function to update difficulty and automatically set score
  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = e.target.value as "Easy" | "Medium" | "Hard";

    // The updateProblem function now handles score updates based on difficulty
    updateProblem(problemIndex, "difficulty", newDifficulty);
  };

  return (
    <div
      id={`problem-${problemIndex}`}
      className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-lg font-medium">
            {problem.questionType === "CODING" ? "Coding Problem" : "MCQ"}{" "}
            {problemIndex + 1}
          </span>

          {/* Only show difficulty selector for coding questions */}
          {problem.questionType === "CODING" && (
            <select
              className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 hover:border-gray-500 transition-colors"
              value={problem.difficulty || "Easy"}
              onChange={handleDifficultyChange}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          )}

          {/* Add question type selector */}
          <select
            className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 hover:border-gray-500 transition-colors"
            value={problem.questionType}
            onChange={(e) =>
              updateProblem(
                problemIndex,
                "questionType",
                e.target.value as QuestionType
              )
            }
          >
            <option value="CODING">Coding Question</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
          </select>

          {/* Show MCQ score badge if applicable */}
          {problem.questionType === "MULTIPLE_CHOICE" && (
            <span className="px-3 py-1.5 bg-purple-900/30 text-purple-300 border border-purple-800/50 rounded-lg text-xs flex items-center">
              <span className="font-semibold">Score:</span>
              <span className="ml-1">1 point (fixed)</span>
            </span>
          )}
        </div>
        <button
          onClick={() => removeProblem(problemIndex)}
          className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {problem.questionType === "CODING" ? (
          <div>
            <input
              type="text"
              className={`w-full bg-gray-700 text-white rounded-lg p-4 text-lg font-medium border border-gray-600 hover:border-gray-500 transition-colors ${
                errors[`problem${problemIndex}Title`] ? "border-red-500" : ""
              }`}
              placeholder="Enter Problem Title"
              value={problem.title}
              onChange={(e) =>
                updateProblem(problemIndex, "title", e.target.value)
              }
            />
            {errors[`problem${problemIndex}Title`] && (
              <p className="text-red-500 text-sm mt-2">
                {errors[`problem${problemIndex}Title`]}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <p className="text-white text-lg font-medium">
              Multiple Choice Question
            </p>
            <div className="flex items-center bg-purple-900/20 px-3 py-1 rounded-lg border border-purple-800/30">
              <svg
                className="w-4 h-4 text-purple-300 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-purple-300 font-medium">
                Score: 1 point (fixed)
              </p>
            </div>
          </div>
        )}

        <div>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-4 min-h-[300px] border border-gray-600 hover:border-gray-500 transition-colors ${
              errors[`problem${problemIndex}Description`]
                ? "border-red-500"
                : ""
            }`}
            placeholder={
              problem.questionType === "CODING"
                ? "Problem Description - Include detailed instructions, constraints, and examples"
                : "Question - Enter your multiple choice question here"
            }
            value={problem.description}
            onChange={(e) =>
              updateProblem(problemIndex, "description", e.target.value)
            }
          />
          {errors[`problem${problemIndex}Description`] && (
            <p className="text-red-500 text-sm mt-2">
              {errors[`problem${problemIndex}Description`]}
            </p>
          )}
        </div>

        {/* Problem Score - Only shown for coding questions */}
        {problem.questionType === "CODING" && (
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm text-gray-400 mb-1">
                Problem Score
              </label>
              <div className="text-sm text-gray-400">
                <span className="mr-2">Default scores:</span>
                <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded-md mr-1">
                  Easy: 10
                </span>
                <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded-md mr-1">
                  Medium: 20
                </span>
                <span className="px-2 py-1 bg-red-900/30 text-red-300 rounded-md">
                  Hard: 30
                </span>
              </div>
            </div>
            <div className="flex">
              <input
                type="number"
                className={`w-full bg-gray-700 text-white rounded-lg p-2.5 ${
                  errors[`problem${problemIndex}Score`] ? "border-red-500" : ""
                }`}
                placeholder="Total points for this problem"
                value={
                  problem.difficulty === "Easy"
                    ? 10
                    : problem.difficulty === "Medium"
                    ? 20
                    : 30
                }
                readOnly
                disabled
              />
              <div className="ml-2 text-gray-400 flex items-center text-sm">
                <span>Score is set automatically based on difficulty</span>
              </div>
            </div>
            {errors[`problem${problemIndex}Score`] && (
              <p className="text-red-500 text-sm mt-1">
                {errors[`problem${problemIndex}Score`]}
              </p>
            )}
          </div>
        )}

        {/* Render based on question type */}
        {problem.questionType === "CODING" ? (
          <>
            {/* Languages Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium text-white">
                  Supported Languages
                </h4>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  onClick={() => addLanguage(problemIndex)}
                >
                  <Plus size={16} /> Add Language
                </button>
              </div>

              <div className="grid gap-4">
                {problem.languages &&
                  problem.languages.map((language, languageIndex) => (
                    <LanguageComponent
                      key={languageIndex}
                      language={language}
                      languageIndex={languageIndex}
                      problemIndex={problemIndex}
                      updateLanguage={updateLanguage}
                      removeLanguage={removeLanguage}
                      errors={errors}
                    />
                  ))}
              </div>
            </div>

            {/* Test Cases Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-medium text-white">Test Cases</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Required: 5 test cases (3 visible, 2 hidden)
                  </p>

                  {/* Test Case Counter */}
                  <div className="flex space-x-3 mt-2">
                    <div
                      className={`px-3 py-1 rounded-md text-xs flex items-center ${
                        problem.testCases.filter((tc) => !tc.isHidden).length >=
                        3
                          ? "bg-green-900/50 text-green-300 border border-green-800"
                          : "bg-red-900/50 text-red-300 border border-red-800"
                      }`}
                    >
                      <span className="font-medium mr-1">Visible:</span>
                      {problem.testCases.filter((tc) => !tc.isHidden).length}/3
                      {problem.testCases.filter((tc) => !tc.isHidden).length >=
                        3 && (
                        <svg
                          className="w-3 h-3 ml-1 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-md text-xs flex items-center ${
                        problem.testCases.filter((tc) => tc.isHidden).length >=
                        2
                          ? "bg-green-900/50 text-green-300 border border-green-800"
                          : "bg-red-900/50 text-red-300 border border-red-800"
                      }`}
                    >
                      <span className="font-medium mr-1">Hidden:</span>
                      {problem.testCases.filter((tc) => tc.isHidden).length}/2
                      {problem.testCases.filter((tc) => tc.isHidden).length >=
                        2 && (
                        <svg
                          className="w-3 h-3 ml-1 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-md text-xs flex items-center ${
                        problem.testCases.length === 5
                          ? "bg-green-900/50 text-green-300 border border-green-800"
                          : "bg-red-900/50 text-red-300 border border-red-800"
                      }`}
                    >
                      <span className="font-medium mr-1">Total:</span>
                      {problem.testCases.length}/5
                      {problem.testCases.length === 5 && (
                        <svg
                          className="w-3 h-3 ml-1 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {fixTestCases && (
                    <button
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                      onClick={() => fixTestCases(problemIndex)}
                    >
                      <Wrench size={16} /> Fix Test Cases
                    </button>
                  )}
                  {problem.testCases.length < 5 && (
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                      onClick={() => addTestCase(problemIndex)}
                    >
                      <Plus size={16} /> Add Test Case
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {problem.testCases.map((testCase, testCaseIndex) => (
                  <TestCase
                    key={testCaseIndex}
                    testCase={testCase}
                    testCaseIndex={testCaseIndex}
                    problemIndex={problemIndex}
                    updateTestCase={updateTestCase}
                    removeTestCase={removeTestCase}
                    errors={errors}
                  />
                ))}
              </div>

              {problem.testCases.filter((tc) => !tc.isHidden).length < 3 && (
                <p className="text-yellow-400 text-sm">
                  You need at least 3 visible test cases (currently have{" "}
                  {problem.testCases.filter((tc) => !tc.isHidden).length})
                </p>
              )}

              {problem.testCases.filter((tc) => tc.isHidden).length < 2 && (
                <p className="text-yellow-400 text-sm">
                  You need at least 2 hidden test cases (currently have{" "}
                  {problem.testCases.filter((tc) => tc.isHidden).length})
                </p>
              )}
            </div>
          </>
        ) : (
          /* Multiple Choice Section */
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-white">Answer Choices</h4>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                onClick={() => addChoice(problemIndex)}
              >
                <Plus size={16} /> Add Choice
              </button>
            </div>

            {errors[`problem${problemIndex}Choices`] && (
              <p className="text-red-500 text-sm my-2 p-2 bg-red-900/30 rounded-lg">
                {errors[`problem${problemIndex}Choices`]}
              </p>
            )}

            {errors[`problem${problemIndex}CorrectChoice`] && (
              <p className="text-red-500 text-sm my-2 p-2 bg-red-900/30 rounded-lg">
                {errors[`problem${problemIndex}CorrectChoice`]}
              </p>
            )}

            <div className="space-y-2">
              {problem.choices &&
                problem.choices.map((choice, choiceIndex) => (
                  <MultipleChoiceComponent
                    key={choiceIndex}
                    choice={choice}
                    choiceIndex={choiceIndex}
                    problemIndex={problemIndex}
                    updateChoice={updateChoice}
                    removeChoice={removeChoice}
                    errors={errors}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Define the DatabaseProblem interface as a type declaration rather than an interface
type DatabaseProblem = {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  score: number;
  questionType: "CODING" | "MULTIPLE_CHOICE";
  assessmentId: string;
  professorId: string;
  testCases: {
    id: string;
    input: string;
    output: string;
    isHidden: boolean;
    problemId: string;
  }[];
  languages: {
    id: string;
    name: string;
    functionSignature: string;
    codePrefix: string;
    starterCode: string;
    codeSuffix: string;
    problemId: string;
  }[];
  choices?: {
    id: string;
    text: string;
    isCorrect: boolean;
    problemId: string;
  }[];
};

// Problem Bank Component for selecting existing problems
interface ProblemBankProps {
  professorId: string;
  onProblemSelect: (problem: IProblem) => void;
}

export const ProblemBank: React.FC<ProblemBankProps> = ({
  professorId,
  onProblemSelect,
}) => {
  const [existingProblems, setExistingProblems] = useState<IProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const [loadingProblemId, setLoadingProblemId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProblems() {
      try {
        setIsLoading(true);
        setError(null);
        const problems = await fetchProfessorProblems(professorId);

        if (!problems || problems.length === 0) {
          setError("No problems found for this professor");
          setExistingProblems([]);
          return;
        }

        // Convert the database problems to match our IProblem interface
        const convertedProblems: IProblem[] = problems.map(
          (problem: DatabaseProblem) => ({
            id:
              Number(problem.id.replace(/\D/g, "")) ||
              Math.floor(Math.random() * 10000),
            databaseId: problem.id,
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty as "Easy" | "Medium" | "Hard",
            score: problem.score,
            questionType: (problem.questionType as QuestionType) || "CODING",
            assessmentId: problem.assessmentId,
            testCases: problem.testCases.map((tc) => ({
              input: tc.input,
              output: tc.output,
              isHidden: tc.isHidden,
            })),
            languages: problem.languages.map((lang) => ({
              name: lang.name as ProgrammingLanguage,
              functionSignature: lang.functionSignature,
              codePrefix: lang.codePrefix,
              starterCode: lang.starterCode,
              codeSuffix: lang.codeSuffix,
            })),
            choices: problem.choices
              ? problem.choices.map((choice) => ({
                  id: choice.id,
                  text: choice.text,
                  isCorrect: choice.isCorrect,
                }))
              : undefined,
          })
        );

        setExistingProblems(convertedProblems);
      } catch (err) {
        console.error("Error loading problems:", err);
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? (err as Error).message
            : "Failed to load problems. Please try again."
        );
        setExistingProblems([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadProblems();
  }, [professorId]);

  // Handle selecting a problem
  const handleSelectProblem = (problem: IProblem) => {
    try {
      setLoadingProblemId(problem.databaseId || String(problem.id));
      onProblemSelect(problem);
    } catch (err) {
      console.error("Error selecting problem:", err);
      setError("Failed to select problem. Please try again.");
    } finally {
      setLoadingProblemId(null);
    }
  };

  // Filter problems based on search query and difficulty
  const filteredProblems = existingProblems.filter((problem) => {
    const matchesQuery =
      searchQuery === "" ||
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty =
      difficultyFilter === "All" || problem.difficulty === difficultyFilter;

    return matchesQuery && matchesDifficulty;
  });

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">Problem Bank</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg border border-red-700">
          <p className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
            {error}
          </p>
        </div>
      )}

      <div className="flex flex-col space-y-4 mb-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search problems by title or description"
            className="w-full bg-gray-700 text-white rounded-lg p-2.5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            className="bg-gray-700 text-white rounded-lg p-2.5"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading problems...</p>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-96">
          {filteredProblems.length === 0 ? (
            <div className="text-center p-4 text-gray-400">
              No problems found. Create new problems or adjust your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProblems.map((problem) => (
                <div
                  key={problem.databaseId || problem.id.toString()}
                  className={`bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors duration-150 ${
                    loadingProblemId ===
                    (problem.databaseId || String(problem.id))
                      ? "ring-2 ring-blue-500 opacity-75"
                      : ""
                  }`}
                  onClick={() => handleSelectProblem(problem)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-white font-semibold">
                      {problem.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        problem.difficulty === "Easy"
                          ? "bg-green-800 text-green-200"
                          : problem.difficulty === "Medium"
                          ? "bg-yellow-800 text-yellow-200"
                          : "bg-red-800 text-red-200"
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                    {problem.description.substring(0, 100)}
                    {problem.description.length > 100 ? "..." : ""}
                  </p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-gray-400 text-xs">
                      Score: {problem.score}
                    </span>
                    <span className="text-gray-400 text-xs">
                      Test Cases: {problem.testCases.length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Modify the ProblemsAndTestCases component to include a feature to add a new problem from an existing one
export const ProblemsAndTestCases: React.FC<ProblemsAndTestCasesProps> = ({
  assessment,
  addProblem,
  removeProblem,
  updateProblem,
  addTestCase,
  removeTestCase,
  updateTestCase,
  addLanguage,
  removeLanguage,
  updateLanguage,
  addChoice,
  removeChoice,
  updateChoice,
  replaceProblem,
  errors,
  professorId,
  fixTestCases,
  fixAllProblems,
}) => {
  const [activeTab, setActiveTab] = useState<"create" | "select">("create");
  const [activeProblemIndex, setActiveProblemIndex] = useState<number>(0);
  const [selectionMode, setSelectionMode] = useState<"replace" | "add">(
    "replace"
  );

  // Handler for selecting a problem from the problem bank
  const handleProblemSelect = (problem: DatabaseProblem | IProblem) => {
    try {
      // Create a new problem ID for the assessment
      const newProblemId =
        Math.max(0, ...assessment.problems.map((p) => p.id)) + 1;

      // Detect question type, default to CODING if not specified
      const questionType =
        (problem as IProblem).questionType ||
        (problem as DatabaseProblem).questionType ||
        "CODING";

      // Set appropriate score based on question type and difficulty
      let score = (problem as any).score || 10;

      if (questionType === "MULTIPLE_CHOICE") {
        score = 1; // Fixed score for multiple choice
      } else if (questionType === "CODING") {
        // Set score based on difficulty
        const difficulty = (problem as DatabaseProblem).difficulty || "Easy";
        if (difficulty === "Easy") score = 10;
        else if (difficulty === "Medium") score = 20;
        else if (difficulty === "Hard") score = 30;
      }

      // Adapt the selected problem to fit our assessment structure
      const newProblem: IProblem = {
        id: newProblemId,
        title: problem.title,
        description: problem.description,
        difficulty:
          questionType === "CODING"
            ? ((problem as DatabaseProblem).difficulty as
                | "Easy"
                | "Medium"
                | "Hard")
            : undefined,
        score: score,
        questionType: questionType as QuestionType,
        // Map test cases from database format to our format
        testCases: problem.testCases.map((tc) => ({
          input: tc.input,
          output: tc.output,
          isHidden: tc.isHidden,
        })),
        // Map languages from database format to our format
        languages: problem.languages.map((lang) => ({
          name: lang.name as ProgrammingLanguage,
          functionSignature: lang.functionSignature,
          codePrefix: lang.codePrefix,
          starterCode: lang.starterCode,
          codeSuffix: lang.codeSuffix,
        })),
        // Handle choices if available (for multiple choice questions)
        choices: (problem as any).choices
          ? (problem as any).choices.map((choice: any) => ({
              text: choice.text,
              isCorrect: choice.isCorrect,
            }))
          : questionType === "MULTIPLE_CHOICE"
          ? [
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ]
          : undefined,
      };

      if (selectionMode === "replace") {
        // Replace the existing problem
        replaceProblem(activeProblemIndex, newProblem);

        // Switch back to create tab
        setActiveTab("create");
      } else {
        // Handle adding a new problem differently
        const currentProblemCount = assessment.problems.length;

        // First add a new empty problem
        addProblem(questionType as QuestionType);

        // Now we need to calculate what index the new problem will have
        const newProblemIndex = currentProblemCount; // It's the current length before adding

        // Delay slightly to allow state to update
        setTimeout(() => {
          // Replace the newly added problem with our problem data
          replaceProblem(newProblemIndex, newProblem);

          // Set the active problem to the one we just added
          setActiveProblemIndex(newProblemIndex);

          // Switch back to create tab
          setActiveTab("create");
        }, 100);
      }
    } catch (error) {
      console.error("Error selecting problem:", error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">
        Problems & Test Cases
      </h2>

      {fixAllProblems && (
        <div className="mb-4">
          <button
            onClick={fixAllProblems}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <span>Fix All Test Cases</span>
          </button>
          <p className="text-gray-400 text-xs mt-1">
            Click to automatically fix test cases to meet the requirement of 3
            visible and 2 hidden test cases
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "create"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            onClick={() => setActiveTab("create")}
          >
            Create New Problems
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "select"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            onClick={() => setActiveTab("select")}
          >
            Select Existing Problems
          </button>
        </div>

        {activeTab === "select" && (
          <div className="flex items-center bg-gray-700 rounded-lg p-2 sm:ml-auto">
            <label className="text-gray-300 mr-3">Selection Mode:</label>
            <div className="flex rounded-lg overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${
                  selectionMode === "replace"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
                onClick={() => setSelectionMode("replace")}
              >
                Replace Current
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  selectionMode === "add"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
                onClick={() => setSelectionMode("add")}
              >
                Add New
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === "create" ? (
        // Existing problems editor
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {assessment.problems.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveProblemIndex(index)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  activeProblemIndex === index
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Problem {index + 1}
              </button>
            ))}

            {/* Dropdown for adding different question types */}
            <div className="relative inline-block">
              <button
                className="px-3 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-md text-sm font-medium flex items-center"
                onClick={() => addProblem("CODING")}
              >
                <Plus size={16} className="mr-1" /> Add Coding Problem
              </button>
            </div>

            <button
              onClick={() => addProblem("MULTIPLE_CHOICE")}
              className="px-3 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-md text-sm font-medium flex items-center"
            >
              <Plus size={16} className="mr-1" /> Add Multiple Choice
            </button>
          </div>

          {assessment.problems.map((problem, index) => (
            <div
              key={index}
              className={index === activeProblemIndex ? "block" : "hidden"}
            >
              <Problem
                problem={problem}
                problemIndex={index}
                updateProblem={updateProblem}
                removeProblem={removeProblem}
                addTestCase={addTestCase}
                removeTestCase={removeTestCase}
                updateTestCase={updateTestCase}
                addLanguage={addLanguage}
                removeLanguage={removeLanguage}
                updateLanguage={updateLanguage}
                addChoice={addChoice}
                removeChoice={removeChoice}
                updateChoice={updateChoice}
                errors={errors}
                fixTestCases={fixTestCases}
              />
            </div>
          ))}
        </div>
      ) : (
        // Problem Bank for selecting existing problems
        <>
          {selectionMode === "replace" && (
            <div className="mb-4 p-3 bg-blue-900/30 text-blue-200 rounded-lg border border-blue-800">
              <p className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Selected problem will replace Problem {activeProblemIndex + 1}
              </p>
            </div>
          )}

          {selectionMode === "add" && (
            <div className="mb-4 p-3 bg-green-900/30 text-green-200 rounded-lg border border-green-800">
              <p className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Selected problem will be added as a new problem
              </p>
            </div>
          )}

          <ProblemBank
            professorId={professorId}
            onProblemSelect={handleProblemSelect}
          />
        </>
      )}
    </div>
  );
};
