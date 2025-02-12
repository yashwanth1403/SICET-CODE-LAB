import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { X } from "lucide-react";
import { Assessment, ValidationErrors } from "../AdminDashboard";

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  testCases: TestCase[];
}

interface ProblemsAndTestCasesProps {
  assessment: Assessment;
  addProblem: () => void;
  removeProblem: (problemIndex: number) => void;
  updateProblem: (
    problemIndex: number,
    field: keyof Problem,
    value: string
  ) => void;
  addTestCase: (problemIndex: number) => void;
  removeTestCase: (problemIndex: number, testCaseIndex: number) => void;
  updateTestCase: (
    problemIndex: number,
    testCaseIndex: number,
    field: keyof TestCase,
    value: string | number | boolean
  ) => void;
  errors: ValidationErrors;
}
interface ProblemProps {
  problem: Problem;
  problemIndex: number;
  updateProblem: (
    problemIndex: number,
    field: keyof Problem,
    value: string
  ) => void;
  removeProblem: (problemIndex: number) => void;
  addTestCase: (problemIndex: number) => void;
  removeTestCase: (problemIndex: number, testCaseIndex: number) => void;
  updateTestCase: (
    problemIndex: number,
    testCaseIndex: number,
    field: keyof TestCase,
    value: string | number | boolean
  ) => void;
  errors: ValidationErrors;
}

interface TestCase {
  input: string;
  output: string;
  score: number;
  isHidden: boolean;
}

interface TestCaseProps {
  testCase: TestCase;
  testCaseIndex: number;
  problemIndex: number;
  updateTestCase: (
    problemIndex: number,
    testCaseIndex: number,
    field: keyof TestCase,
    value: string | number | boolean
  ) => void;
  removeTestCase: (problemIndex: number, testCaseIndex: number) => void;
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
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-white">Test Case {testCaseIndex + 1}</h5>
        <button
          onClick={() => removeTestCase(problemIndex, testCaseIndex)}
          className="text-gray-400 hover:text-white"
          type="button"
        >
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Input</label>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 ${
              errors[`problem${problemIndex}TestCase${testCaseIndex}Input`]
                ? "border-red-500"
                : ""
            }`}
            rows={3}
            placeholder="Test case input"
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
          {errors[`problem${problemIndex}TestCase${testCaseIndex}Input`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`problem${problemIndex}TestCase${testCaseIndex}Input`]}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Expected Output
          </label>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-2.5 ${
              errors[`problem${problemIndex}TestCase${testCaseIndex}Output`]
                ? "border-red-500"
                : ""
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
          {errors[`problem${problemIndex}TestCase${testCaseIndex}Output`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`problem${problemIndex}TestCase${testCaseIndex}Output`]}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Score</label>
          <input
            type="number"
            className={`w-24 bg-gray-700 text-white rounded-lg p-2 ${
              errors[`problem${problemIndex}TestCase${testCaseIndex}Score`]
                ? "border-red-500"
                : ""
            }`}
            placeholder="Score"
            value={testCase.score}
            onChange={(e) =>
              updateTestCase(
                problemIndex,
                testCaseIndex,
                "score",
                Number(e.target.value)
              )
            }
          />
          {errors[`problem${problemIndex}TestCase${testCaseIndex}Score`] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[`problem${problemIndex}TestCase${testCaseIndex}Score`]}
            </p>
          )}
        </div>
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

const Problem: React.FC<ProblemProps> = ({
  problem,
  problemIndex,
  updateProblem,
  removeProblem,
  addTestCase,
  removeTestCase,
  updateTestCase,
  errors,
}) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-lg font-medium">
            Problem {problemIndex + 1}
          </span>
          <select
            className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 hover:border-gray-500 transition-colors"
            value={problem.difficulty}
            onChange={(e) =>
              updateProblem(problemIndex, "difficulty", e.target.value)
            }
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
        <button
          onClick={() => removeProblem(problemIndex)}
          className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
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

        <div>
          <textarea
            className={`w-full bg-gray-700 text-white rounded-lg p-4 min-h-[300px] border border-gray-600 hover:border-gray-500 transition-colors ${
              errors[`problem${problemIndex}Description`]
                ? "border-red-500"
                : ""
            }`}
            placeholder="Problem Description - Include detailed instructions, constraints, and examples"
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

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-medium text-white">Test Cases</h4>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
              onClick={() => addTestCase(problemIndex)}
            >
              <Plus size={16} /> Add Test Case
            </button>
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
        </div>
      </div>
    </div>
  );
};
// Problems & Test Cases Component
export const ProblemsAndTestCases: React.FC<ProblemsAndTestCasesProps> = ({
  assessment,
  addProblem,
  removeProblem,
  updateProblem,
  addTestCase,
  removeTestCase,
  updateTestCase,
  errors,
}) => {
  return (
    <div className="relative px-4">
      {/* Problems Container */}
      <div
        className="overflow-x-auto flex gap-6 pb-6 pt-2 px-2 snap-x snap-mandatory scroll-smooth"
        style={{ scrollBehavior: "smooth" }}
      >
        {assessment.problems.map((problem, problemIndex) => (
          <div
            key={problemIndex}
            className="min-w-[450px] max-w-[450px] snap-center transform transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
              {/* Problem Header */}
              <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 sticky top-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Problem {problemIndex + 1}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium
                      ${
                        problem.difficulty === "Easy"
                          ? "bg-green-500/20 text-green-400"
                          : problem.difficulty === "Medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                    <button
                      onClick={() => removeProblem(problemIndex)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Problem Content */}
              <div className="p-6">
                <Problem
                  problem={problem}
                  problemIndex={problemIndex}
                  updateProblem={updateProblem}
                  removeProblem={removeProblem}
                  addTestCase={addTestCase}
                  removeTestCase={removeTestCase}
                  updateTestCase={updateTestCase}
                  errors={errors}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Problem Card */}
        <div className="min-w-[450px] snap-center flex items-center justify-center">
          <button
            onClick={addProblem}
            className="group flex flex-col items-center gap-3 bg-gray-800/50 hover:bg-gray-800 
              border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-8
              transition-all duration-200 hover:shadow-xl"
          >
            <div className="p-3 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20">
              <Plus size={24} className="text-blue-400" />
            </div>
            <span className="text-gray-400 group-hover:text-white font-medium">
              Add New Problem
            </span>
          </button>
        </div>
      </div>

      {/* Scroll Buttons */}
      <button
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-800/90 hover:bg-gray-800 
          p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200
          border border-gray-700 hover:border-gray-600"
        onClick={() =>
          document.querySelector(".overflow-x-auto")?.scrollBy(-470, 0)
        }
      >
        <ChevronLeft size={20} className="text-gray-400" />
      </button>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-800/90 hover:bg-gray-800 
          p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200
          border border-gray-700 hover:border-gray-600"
        onClick={() =>
          document.querySelector(".overflow-x-auto")?.scrollBy(470, 0)
        }
      >
        <ChevronRight size={20} className="text-gray-400" />
      </button>
    </div>
  );
};
