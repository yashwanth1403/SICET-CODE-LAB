"use client";
import React, { useEffect, useState } from "react";
import { createAssessmentHandler } from "@/actions/CreateAssessment";
import { ProgressSteps } from "./AdminAssement/ProgressSteps";
import { BasicDetails } from "./AdminAssement/BasicDetails";
import { ProblemsAndTestCases } from "./AdminAssement/Problem";
import { Schedule } from "./AdminAssement/Schedule";
import { NavigationButtons } from "./AdminAssement/NavigationButtons";
import { Review } from "./AdminAssement/Review";
import {
  ValidationErrors,
  IProblem,
  UpdateTestCaseFunction,
  UpdateLanguageFunction,
  UpdateChoiceFunction,
  QuestionType,
  Assessment,
} from "@/types";

// Main Dashboard Component
interface CreateAssessmentProps {
  professorId: string;
}

const CreateAssessment: React.FC<CreateAssessmentProps> = ({ professorId }) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isClient, SetIsClient] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showErrorSummary, setShowErrorSummary] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<Assessment>({
    title: "",
    batches: [],
    departments: [],
    startTime: "",
    endTime: "",
    duration: 120,
    totalQuestions: 1, // This will be auto-updated based on problems.length
    topics: [],
    problems: [
      {
        id: 1,
        title: "",
        description: "",
        difficulty: "Easy" as const,
        score: 10,
        questionType: "CODING" as const,
        testCases: [
          {
            input: "",
            output: "",
            isHidden: false,
          },
          {
            input: "",
            output: "",
            isHidden: false,
          },
          {
            input: "",
            output: "",
            isHidden: false,
          },
          {
            input: "",
            output: "",
            isHidden: true,
          },
          {
            input: "",
            output: "",
            isHidden: true,
          },
        ],
        languages: [
          {
            name: "Python" as const,
            functionSignature: "def solution(input_data):",
            codePrefix:
              "# This code runs before the student's code\n\ndef solution(input_data):\n",
            starterCode: "    # Your Python solution here\n    return None",
            codeSuffix:
              "\n\n# This code runs after the student's code\ninput_data = input()\nprint(solution(input_data))",
          },
        ],
      },
    ],
  });

  const steps = [
    "Basic Details",
    "Problems & Test Cases",
    "Schedule",
    "Review",
  ];

  // Automatically update totalQuestions whenever problems array changes
  useEffect(() => {
    setAssessment((prev) => ({
      ...prev,
      totalQuestions: prev.problems.length,
    }));
  }, [assessment.problems.length]);

  const validateStep = (step: number): boolean => {
    console.log("Validating step:", step);
    const newErrors: ValidationErrors = {};

    if (step === 0) {
      if (!assessment.title.trim()) newErrors.title = "Title is required";
      if (!assessment.batches.length) newErrors.batch = "Batch is required";
      if (assessment.departments.length === 0)
        newErrors.departments = "Select at least one department";
    } else if (step === 1) {
      assessment.problems.forEach((problem, idx) => {
        console.log(`Validating Problem ${idx + 1}:`, problem.questionType);

        // Common validations for all question types
        if (!problem.description.trim()) {
          console.log(`Problem ${idx + 1}: Missing description`);
          newErrors[`problem${idx}Description`] =
            "Problem description is required";
        }

        // Title is only required for coding questions
        if (problem.questionType === "CODING" && !problem.title.trim()) {
          console.log(`Problem ${idx + 1}: Missing title for coding question`);
          newErrors[`problem${idx}Title`] = "Problem title is required";
        }

        // Specific validations based on question type
        if (problem.questionType === "CODING") {
          // Validate score based on difficulty
          const expectedScore =
            problem.difficulty === "Easy"
              ? 10
              : problem.difficulty === "Medium"
              ? 20
              : 30;

          // If score is being entered manually, show warning about expected score
          if (problem.score !== expectedScore) {
            // Update score to match difficulty
            const updatedProblems = [...assessment.problems];
            updatedProblems[idx].score = expectedScore;

            // Apply the update
            setAssessment((prevState) => ({
              ...prevState,
              problems: updatedProblems,
            }));

            console.log(
              `Problem ${idx + 1}: Score adjusted to ${expectedScore} for ${
                problem.difficulty
              } difficulty`
            );
          }

          // Validate test cases (must have 5 - 3 visible and 2 hidden)
          const visibleCount = problem.testCases.filter(
            (tc) => !tc.isHidden
          ).length;
          const hiddenCount = problem.testCases.filter(
            (tc) => tc.isHidden
          ).length;

          console.log(
            `Problem ${
              idx + 1
            }: Test cases - ${visibleCount} visible, ${hiddenCount} hidden`
          );

          if (visibleCount < 3) {
            console.log(`Problem ${idx + 1}: Not enough visible test cases`);
            newErrors[
              `problem${idx}TestCases`
            ] = `Need at least 3 visible test cases (currently have ${visibleCount})`;
          }

          if (hiddenCount < 2) {
            console.log(`Problem ${idx + 1}: Not enough hidden test cases`);
            newErrors[
              `problem${idx}HiddenTestCases`
            ] = `Need at least 2 hidden test cases (currently have ${hiddenCount})`;
          }

          // Validate test case content
          problem.testCases.forEach((testCase, testIdx) => {
            console.log(
              `Problem ${idx + 1}, TestCase ${
                testIdx + 1
              }: input=${!!testCase.input.trim()}, output=${!!testCase.output.trim()}, hidden=${
                testCase.isHidden
              }`
            );

            if (!testCase.input.trim()) {
              console.log(
                `Problem ${idx + 1}, TestCase ${testIdx + 1}: Missing input`
              );
              newErrors[`problem${idx}TestCase${testIdx}Input`] =
                "Input is required";
            }
            if (!testCase.output.trim()) {
              console.log(
                `Problem ${idx + 1}, TestCase ${testIdx + 1}: Missing output`
              );
              newErrors[`problem${idx}TestCase${testIdx}Output`] =
                "Output is required";
            }
          });

          // Validate languages for coding questions
          if (!problem.languages || problem.languages.length === 0) {
            console.log(`Problem ${idx + 1}: No languages defined`);
            newErrors[`problem${idx}Languages`] =
              "At least one language is required";
          } else {
            problem.languages.forEach((lang, langIdx) => {
              console.log(
                `Problem ${idx + 1}, Language ${langIdx + 1}: ${lang.name}`
              );

              if (!lang.name.trim()) {
                console.log(
                  `Problem ${idx + 1}, Language ${langIdx + 1}: Missing name`
                );
                newErrors[`problem${idx}Language${langIdx}Name`] =
                  "Language name is required";
              }
              if (!lang.functionSignature.trim()) {
                console.log(
                  `Problem ${idx + 1}, Language ${
                    langIdx + 1
                  }: Missing function signature`
                );
                newErrors[`problem${idx}Language${langIdx}FunctionSignature`] =
                  "Function signature is required";
              }
              if (!lang.codePrefix.trim()) {
                console.log(
                  `Problem ${idx + 1}, Language ${
                    langIdx + 1
                  }: Missing code prefix`
                );
                newErrors[`problem${idx}Language${langIdx}CodePrefix`] =
                  "Code prefix is required";
              }
              if (!lang.starterCode.trim()) {
                console.log(
                  `Problem ${idx + 1}, Language ${
                    langIdx + 1
                  }: Missing starter code`
                );
                newErrors[`problem${idx}Language${langIdx}StarterCode`] =
                  "Starter code is required";
              }
              if (!lang.codeSuffix.trim()) {
                console.log(
                  `Problem ${idx + 1}, Language ${
                    langIdx + 1
                  }: Missing code suffix`
                );
                newErrors[`problem${idx}Language${langIdx}CodeSuffix`] =
                  "Code suffix is required";
              }
            });
          }
        } else if (problem.questionType === "MULTIPLE_CHOICE") {
          // Validate score for MCQ (must be 1)
          if (problem.score !== 1) {
            // Update score to 1 instead of showing an error
            const updatedProblems = [...assessment.problems];
            updatedProblems[idx].score = 1;

            // Apply the update
            setAssessment((prevState) => ({
              ...prevState,
              problems: updatedProblems,
            }));

            console.log(`Fixed MCQ problem ${idx + 1} score to 1`);
          }

          // Validate choices for multiple choice questions
          if (!problem.choices || problem.choices.length < 2) {
            newErrors[`problem${idx}Choices`] =
              "At least two choices are required";
          } else {
            let hasCorrectAnswer = false;

            problem.choices.forEach((choice, choiceIdx) => {
              if (!choice.text.trim()) {
                newErrors[`problem${idx}Choice${choiceIdx}Text`] =
                  "Choice text is required";
              }
              if (choice.isCorrect) {
                hasCorrectAnswer = true;
              }
            });

            if (!hasCorrectAnswer) {
              newErrors[`problem${idx}CorrectChoice`] =
                "At least one correct answer must be selected";
            }
          }
        }
      });
    } else if (step === 2) {
      if (!assessment.startTime) newErrors.startTime = "Start time is required";
      if (!assessment.endTime) newErrors.endTime = "End time is required";
      if (assessment.duration <= 0)
        newErrors.duration = "Duration must be greater than 0";
      if (
        assessment.startTime &&
        assessment.endTime &&
        new Date(assessment.startTime) >= new Date(assessment.endTime)
      ) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    console.log(
      "Validation errors:",
      Object.keys(newErrors).length > 0 ? newErrors : "No errors"
    );
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    console.log("Handle next clicked for step:", activeStep);
    const isValid = validateStep(activeStep);
    console.log("Is valid:", isValid);

    if (isValid) {
      setShowErrorSummary(false); // Hide error summary if validation passes
      if (activeStep === steps.length - 1) {
        // Log assessment data for debugging before submission
        console.log(
          "Assessment data before submission:",
          JSON.stringify({
            ...assessment,
            problems: assessment.problems.map((p) => ({
              questionType: p.questionType,
              title: p.title,
              description: p.description?.substring(0, 30) + "...",
              choices:
                p.questionType === "MULTIPLE_CHOICE"
                  ? p.choices?.length
                  : undefined,
              testCases:
                p.questionType === "CODING" ? p.testCases?.length : undefined,
              score: p.score,
            })),
          })
        );

        // Ensure MCQ problems have proper choices
        const finalAssessment = { ...assessment };
        finalAssessment.problems = assessment.problems.map((p, idx) => {
          if (p.questionType === "MULTIPLE_CHOICE") {
            console.log(`Validating MCQ problem ${idx}:`, {
              choices: p.choices,
              length: p.choices?.length || 0,
            });

            // Ensure choices exist with at least one correct answer
            if (!p.choices || p.choices.length < 2) {
              console.warn(`Adding default choices to MCQ problem ${idx}`);
              p.choices = [
                { text: "Option 1", isCorrect: true },
                { text: "Option 2", isCorrect: false },
                { text: "Option 3", isCorrect: false },
                { text: "Option 4", isCorrect: false },
              ];
            } else if (!p.choices.some((c) => c.isCorrect)) {
              console.warn(
                `No correct answer in MCQ problem ${idx}, setting first choice as correct`
              );
              p.choices[0].isCorrect = true;
            }

            // Force score to be 1
            p.score = 1;
          }
          return p;
        });

        console.log(
          "Creating assessment with:",
          finalAssessment.problems.length,
          "problems"
        );

        const createAssessmentResult = await createAssessmentHandler({
          ...finalAssessment,
          professorId,
        });

        if (createAssessmentResult.success) {
          clearDraft(); // Clear draft after successful submission
          alert("Assessment Created Successfully");
        } else {
          console.error(
            "Failed to create assessment:",
            createAssessmentResult.error
          );
          alert(`Failed to create assessment: ${createAssessmentResult.error}`);
        }
      } else {
        setActiveStep(activeStep + 1);
      }
    } else {
      // Show error summary at the top
      setShowErrorSummary(true);
      // Auto-scroll to the top to see the errors
      window.scrollTo({ top: 0, behavior: "smooth" });

      // If validation fails, show option to continue anyway
      if (
        window.confirm(
          "There are validation errors. Would you like to continue anyway? (This may cause issues later)"
        )
      ) {
        console.log("Bypassing validation and continuing to next step");
        if (activeStep === steps.length - 1) {
          // Handle final step submission
          const createAssessmentResult = await createAssessmentHandler({
            ...assessment,
            professorId,
          });

          if (createAssessmentResult) {
            clearDraft();
            alert("Assessment Created Successfully");
          } else {
            alert("Failed to create assessment");
          }
        } else {
          setActiveStep(activeStep + 1);
        }
      }
    }
  };

  const addProblem = (
    questionType: "CODING" | "MULTIPLE_CHOICE" = "CODING"
  ) => {
    setAssessment((prev) => {
      const newProblem: IProblem = {
        id: prev.problems.length + 1,
        title: "",
        description: "",
        difficulty: questionType === "CODING" ? ("Easy" as const) : undefined,
        score: questionType === "CODING" ? 10 : 1, // Default score based on type
        questionType: questionType,
        testCases:
          questionType === "CODING"
            ? [
                // 3 visible test cases
                {
                  input: "",
                  output: "",
                  isHidden: false,
                },
                {
                  input: "",
                  output: "",
                  isHidden: false,
                },
                {
                  input: "",
                  output: "",
                  isHidden: false,
                },
                // 2 hidden test cases
                {
                  input: "",
                  output: "",
                  isHidden: true,
                },
                {
                  input: "",
                  output: "",
                  isHidden: true,
                },
              ]
            : [],
        languages:
          questionType === "CODING"
            ? [
                {
                  name: "Python" as const,
                  functionSignature: "def solution(input_data):",
                  codePrefix:
                    "# This code runs before the student's code\n\ndef solution(input_data):\n",
                  starterCode:
                    "    # Your Python solution here\n    return None",
                  codeSuffix:
                    "\n\n# This code runs after the student's code\ninput_data = input()\nprint(solution(input_data))",
                },
              ]
            : [],
        choices:
          questionType === "MULTIPLE_CHOICE"
            ? [
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
              ]
            : undefined,
      };

      const newProblems = [...prev.problems, newProblem];

      return {
        ...prev,
        problems: newProblems,
        totalQuestions: newProblems.length,
      };
    });
  };

  const addTestCase = (problemIndex: number) => {
    const updatedProblems = [...assessment.problems];
    updatedProblems[problemIndex].testCases.push({
      input: "",
      output: "",
      isHidden: false,
    });
    setAssessment({ ...assessment, problems: updatedProblems });
  };

  const removeTestCase = (problemIndex: number, testCaseIndex: number) => {
    const updatedProblems = [...assessment.problems];
    if (updatedProblems[problemIndex].testCases.length > 1) {
      updatedProblems[problemIndex].testCases.splice(testCaseIndex, 1);
      setAssessment({ ...assessment, problems: updatedProblems });
    }
  };

  const addLanguage = (problemIndex: number) => {
    const updatedProblems = [...assessment.problems];
    // Initialize languages array if it doesn't exist
    if (!updatedProblems[problemIndex].languages) {
      updatedProblems[problemIndex].languages = [];
    }

    // Default values based on the language
    updatedProblems[problemIndex].languages.push({
      name: "Python" as const,
      functionSignature: "def solution(input_data):",
      codePrefix:
        "# This code runs before the student's code\n\ndef solution(input_data):\n",
      starterCode: "    # Your Python solution here\n    return None",
      codeSuffix:
        "\n\n# This code runs after the student's code\ninput_data = input()\nprint(solution(input_data))",
    });

    setAssessment({ ...assessment, problems: updatedProblems });
  };

  const removeLanguage = (problemIndex: number, languageIndex: number) => {
    const updatedProblems = [...assessment.problems];
    if (
      updatedProblems[problemIndex].languages &&
      updatedProblems[problemIndex].languages.length > 1
    ) {
      updatedProblems[problemIndex].languages.splice(languageIndex, 1);
      setAssessment({ ...assessment, problems: updatedProblems });
    }
  };

  const addChoice = (problemIndex: number) => {
    const updatedProblems = [...assessment.problems];
    if (!updatedProblems[problemIndex].choices) {
      updatedProblems[problemIndex].choices = [];
    }

    updatedProblems[problemIndex].choices.push({
      text: "",
      isCorrect: false,
    });

    setAssessment({ ...assessment, problems: updatedProblems });
  };

  const removeChoice = (problemIndex: number, choiceIndex: number) => {
    const updatedProblems = [...assessment.problems];
    if (
      updatedProblems[problemIndex].choices &&
      updatedProblems[problemIndex].choices.length > 2
    ) {
      updatedProblems[problemIndex].choices.splice(choiceIndex, 1);
      setAssessment({ ...assessment, problems: updatedProblems });
    }
  };

  const updateChoice: UpdateChoiceFunction = (
    problemIndex,
    choiceIndex,
    field,
    value
  ) => {
    const updatedProblems = [...assessment.problems];
    if (!updatedProblems[problemIndex].choices) {
      updatedProblems[problemIndex].choices = [];
    }

    updatedProblems[problemIndex].choices[choiceIndex] = {
      ...updatedProblems[problemIndex].choices[choiceIndex],
      [field]: value,
    };

    // For radio button behavior when setting isCorrect to true
    if (field === "isCorrect" && value === true) {
      // Set all other choices to false
      updatedProblems[problemIndex].choices.forEach((choice, idx) => {
        if (idx !== choiceIndex) {
          choice.isCorrect = false;
        }
      });
    }

    setAssessment({ ...assessment, problems: updatedProblems });
  };

  const removeProblem = (problemIndex: number) => {
    if (assessment.problems.length > 1) {
      const updatedProblems = assessment.problems.filter(
        (_, idx) => idx !== problemIndex
      );
      setAssessment((prev) => ({
        ...prev,
        problems: updatedProblems,
        totalQuestions: updatedProblems.length,
      }));
    }
  };

  const updateProblem = (
    problemIndex: number,
    field: keyof IProblem,
    value: string | number | QuestionType
  ) => {
    const updatedProblems = [...assessment.problems];

    // Handle special case when changing questionType
    if (field === "questionType") {
      const newType = value as QuestionType;

      if (
        newType === "CODING" &&
        (!updatedProblems[problemIndex].languages ||
          updatedProblems[problemIndex].languages.length === 0)
      ) {
        // Initialize coding-specific fields when switching to CODING
        updatedProblems[problemIndex] = {
          ...updatedProblems[problemIndex],
          questionType: newType,
          difficulty: "Easy", // Set default difficulty
          score: 10, // Set default score based on difficulty
          testCases: [
            // 3 visible test cases
            {
              input: "",
              output: "",
              isHidden: false,
            },
            {
              input: "",
              output: "",
              isHidden: false,
            },
            {
              input: "",
              output: "",
              isHidden: false,
            },
            // 2 hidden test cases
            {
              input: "",
              output: "",
              isHidden: true,
            },
            {
              input: "",
              output: "",
              isHidden: true,
            },
          ],
          languages: [
            {
              name: "Python" as const,
              functionSignature: "def solution(input_data):",
              codePrefix:
                "# This code runs before the student's code\n\ndef solution(input_data):\n",
              starterCode: "    # Your Python solution here\n    return None",
              codeSuffix:
                "\n\n# This code runs after the student's code\ninput_data = input()\nprint(solution(input_data))",
            },
          ],
        };
      } else if (
        newType === "MULTIPLE_CHOICE" &&
        (!updatedProblems[problemIndex].choices ||
          updatedProblems[problemIndex].choices.length === 0)
      ) {
        // Initialize MCQ-specific fields when switching to MULTIPLE_CHOICE
        updatedProblems[problemIndex] = {
          ...updatedProblems[problemIndex],
          questionType: newType,
          difficulty: undefined, // Remove difficulty for MCQ
          score: 1, // Set fixed score for MCQ
          choices: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
        };
      } else {
        // Just update the type and ensure score is correct for the type
        updatedProblems[problemIndex] = {
          ...updatedProblems[problemIndex],
          questionType: value as QuestionType,
        };

        // If switching to MCQ, force score to 1
        if (newType === "MULTIPLE_CHOICE") {
          updatedProblems[problemIndex].score = 1;
          updatedProblems[problemIndex].difficulty = undefined; // Remove difficulty for MCQ
        } else if (newType === "CODING") {
          // If switching to CODING, set score based on difficulty
          const difficulty = updatedProblems[problemIndex].difficulty || "Easy";
          if (difficulty === "Easy") updatedProblems[problemIndex].score = 10;
          else if (difficulty === "Medium")
            updatedProblems[problemIndex].score = 20;
          else updatedProblems[problemIndex].score = 30;
        }
      }
    } else if (field === "difficulty" && typeof value === "string") {
      // Handle difficulty changes which should also update score for coding questions
      const newDifficulty = value as "Easy" | "Medium" | "Hard";
      const problem = updatedProblems[problemIndex];

      if (problem.questionType === "CODING") {
        // Update score based on new difficulty
        let newScore = 10; // Default for Easy

        if (newDifficulty === "Medium") {
          newScore = 20;
        } else if (newDifficulty === "Hard") {
          newScore = 30;
        }

        updatedProblems[problemIndex] = {
          ...problem,
          difficulty: newDifficulty,
          score: newScore, // Always sync score with difficulty for coding questions
        };

        // Log to console for debugging
        console.log(
          `Updated problem ${problemIndex} difficulty to ${newDifficulty} with score ${newScore}`
        );
      } else {
        // For non-coding questions, just update the difficulty
        updatedProblems[problemIndex] = {
          ...problem,
          difficulty: newDifficulty,
        };
      }
    } else {
      // Regular field update for all other fields

      // Special handling for score field
      if (field === "score") {
        const questionType = updatedProblems[problemIndex].questionType;

        // Force score to be 1 for multiple choice questions regardless of input
        if (questionType === "MULTIPLE_CHOICE") {
          // Always set score to 1 for MCQ questions
          updatedProblems[problemIndex] = {
            ...updatedProblems[problemIndex],
            score: 1, // Force to number 1
          };
          console.log(
            `Force setting score to 1 for MCQ problem ${problemIndex}`
          );
        } else if (questionType === "CODING") {
          // For coding questions, score should always be determined by difficulty
          const difficulty = updatedProblems[problemIndex].difficulty || "Easy";
          const expectedScore =
            difficulty === "Easy" ? 10 : difficulty === "Medium" ? 20 : 30;

          // Set score based on difficulty, not the input value
          updatedProblems[problemIndex] = {
            ...updatedProblems[problemIndex],
            score: expectedScore,
          };

          console.log(
            `Adjusted score to ${expectedScore} based on ${difficulty} difficulty`
          );
        } else {
          // For other question types or unknown cases, force to number
          updatedProblems[problemIndex] = {
            ...updatedProblems[problemIndex],
            [field]: typeof value === "string" ? parseInt(value) || 0 : value,
          };
        }
      } else {
        // For all other fields, just update normally
        updatedProblems[problemIndex] = {
          ...updatedProblems[problemIndex],
          [field]: value,
        };

        // Special post-update check for MCQ questions to ensure score remains 1
        if (
          updatedProblems[problemIndex].questionType === "MULTIPLE_CHOICE" &&
          updatedProblems[problemIndex].score !== 1
        ) {
          updatedProblems[problemIndex].score = 1;
          console.log(
            `Force corrected score to 1 for MCQ problem ${problemIndex}`
          );
        }
      }
    }

    setAssessment({ ...assessment, problems: updatedProblems });
  };

  const updateTestCase: UpdateTestCaseFunction = (
    problemIndex,
    testCaseIndex,
    field,
    value
  ) => {
    const updatedProblems = [...assessment.problems];
    updatedProblems[problemIndex].testCases[testCaseIndex] = {
      ...updatedProblems[problemIndex].testCases[testCaseIndex],
      [field]: value,
    };
    setAssessment({ ...assessment, problems: updatedProblems });
  };

  const updateLanguage: UpdateLanguageFunction = (
    problemIndex,
    languageIndex,
    field,
    value
  ) => {
    const updatedProblems = [...assessment.problems];
    if (!updatedProblems[problemIndex].languages) {
      updatedProblems[problemIndex].languages = [];
    }
    updatedProblems[problemIndex].languages[languageIndex] = {
      ...updatedProblems[problemIndex].languages[languageIndex],
      [field]: value,
    };
    setAssessment({ ...assessment, problems: updatedProblems });
  };

  // Function to replace a problem entirely
  const replaceProblem = (problemIndex: number, newProblem: IProblem) => {
    setAssessment((prev) => {
      const problems = [...prev.problems];
      problems[problemIndex] = newProblem;
      return {
        ...prev,
        problems,
      };
    });
  };

  // Auto-save on changes with debounce
  useEffect(() => {
    if (!isClient) return;

    const saveTimer = setTimeout(() => {
      saveDraft();
    }, 2000); // 2 second debounce

    return () => clearTimeout(saveTimer);
  }, [assessment, activeStep, isClient]);

  // Define the draft key with a timestamp to ensure it's unique
  const DRAFT_KEY = "assessment_draft_v2";

  const saveDraft = () => {
    if (typeof window !== "undefined" && isClient) {
      try {
        const now = new Date();
        const draftData = {
          ...assessment,
          totalQuestions: assessment.problems.length, // Ensure totalQuestions is correct when saving
          lastActiveStep: activeStep,
          lastModified: now.toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        setLastSaved(now.toLocaleTimeString());
        console.log("Draft saved at", now.toLocaleTimeString());
      } catch (error) {
        console.error("Error saving draft:", error);
      }
    }
  };

  const loadDraft = () => {
    if (typeof window !== "undefined") {
      try {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (!savedDraft) return false;

        const parsedDraft = JSON.parse(savedDraft);
        console.log("Loading draft from", parsedDraft.lastModified);

        // Ensure totalQuestions matches problems.length when loading a draft
        parsedDraft.totalQuestions = parsedDraft.problems?.length || 1;

        // Ensure each problem has required properties
        if (Array.isArray(parsedDraft.problems)) {
          parsedDraft.problems = parsedDraft.problems.map(
            (problem: Partial<IProblem>, index: number) => {
              const questionType = problem.questionType || "CODING";

              return {
                id: problem.id || index + 1,
                title: problem.title || "",
                description: problem.description || "",
                difficulty: problem.difficulty || "Easy",
                score: problem.score || 100,
                questionType: questionType,
                testCases:
                  questionType === "CODING" && Array.isArray(problem.testCases)
                    ? problem.testCases
                    : questionType === "CODING"
                    ? [{ input: "", output: "", isHidden: false }]
                    : [],
                languages:
                  questionType === "CODING" && Array.isArray(problem.languages)
                    ? problem.languages
                    : questionType === "CODING"
                    ? [
                        {
                          name: "Python",
                          functionSignature: "def solution(input_data):",
                          codePrefix:
                            "# This code runs before the student's code\n\ndef solution(input_data):\n",
                          starterCode:
                            "    # Your Python solution here\n    return None",
                          codeSuffix:
                            "\n\n# This code runs after the student's code\ninput_data = input()\nprint(solution(input_data))",
                        },
                      ]
                    : [],
                choices:
                  questionType === "MULTIPLE_CHOICE" &&
                  Array.isArray(problem.choices)
                    ? problem.choices
                    : questionType === "MULTIPLE_CHOICE"
                    ? [
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false },
                        { text: "", isCorrect: false },
                      ]
                    : undefined,
              };
            }
          );
        } else {
          // If no problems in the draft, initialize with default problem
          parsedDraft.problems = [
            {
              id: 1,
              title: "",
              description: "",
              difficulty: "Easy" as const,
              score: 100,
              questionType: "CODING" as const,
              testCases: [
                {
                  input: "",
                  output: "",
                  isHidden: false,
                },
              ],
              languages: [
                {
                  name: "Python" as const,
                  functionSignature: "def solution(input_data):",
                  codePrefix:
                    "# This code runs before the student's code\n\ndef solution(input_data):\n",
                  starterCode:
                    "    # Your Python solution here\n    return None",
                  codeSuffix:
                    "\n\n# This code runs after the student's code\ninput_data = input()\nprint(solution(input_data))",
                },
              ],
            },
          ];
        }

        // Set the assessment state with the loaded draft
        setAssessment(parsedDraft);
        // Set the active step
        setActiveStep(parsedDraft.lastActiveStep || 0);
        return true;
      } catch (error) {
        console.error("Error loading draft:", error);
        clearDraft(); // Clear the corrupted draft
      }
    }
    return false;
  };

  const clearDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_KEY);
      console.log("Draft cleared");
    }
  };

  // Load draft on mount
  useEffect(() => {
    if (!isClient) return;
    const draftLoaded = loadDraft();
    if (draftLoaded) {
      console.log("Draft loaded successfully");
    } else {
      console.log("No valid draft found, using initial state");
    }
  }, [isClient]);

  useEffect(() => {
    async function fetchData() {
      SetIsClient(true);
    }

    fetchData();
  }, []);

  // Function to fix test cases to match requirements
  const fixTestCases = (problemIndex: number) => {
    console.log(`Fixing test cases for problem ${problemIndex + 1}`);

    const updatedProblems = [...assessment.problems];
    const problem = updatedProblems[problemIndex];

    if (problem.questionType !== "CODING") {
      return; // Only fix coding problems
    }

    const existingTestCases = [...problem.testCases];
    const newTestCases = [];

    // Get existing visible and hidden test cases
    const visibleCases = existingTestCases.filter((tc) => !tc.isHidden);
    const hiddenCases = existingTestCases.filter((tc) => tc.isHidden);

    // Add up to 3 visible test cases
    for (let i = 0; i < 3; i++) {
      if (i < visibleCases.length) {
        newTestCases.push(visibleCases[i]);
      } else {
        // Create a new visible test case
        newTestCases.push({
          input: `Sample input ${i + 1}`,
          output: `Sample output ${i + 1}`,
          isHidden: false,
        });
      }
    }

    // Add up to 2 hidden test cases
    for (let i = 0; i < 2; i++) {
      if (i < hiddenCases.length) {
        newTestCases.push(hiddenCases[i]);
      } else {
        // Create a new hidden test case
        newTestCases.push({
          input: `Hidden input ${i + 1}`,
          output: `Hidden output ${i + 1}`,
          isHidden: true,
        });
      }
    }

    // Update the problem with fixed test cases
    updatedProblems[problemIndex].testCases = newTestCases;
    setAssessment({ ...assessment, problems: updatedProblems });

    console.log(
      `Fixed test cases: ${newTestCases.length} total, ${
        newTestCases.filter((tc) => !tc.isHidden).length
      } visible, ${newTestCases.filter((tc) => tc.isHidden).length} hidden`
    );

    return newTestCases;
  };

  // Add button to fix test cases in the Problems component
  const fixAllProblems = () => {
    console.log("Fixing all problems to meet validation requirements");

    const updatedProblems = [...assessment.problems];

    // Fix each coding problem
    updatedProblems.forEach((problem, index) => {
      if (problem.questionType === "CODING") {
        fixTestCases(index);
      }
    });

    // Alert the user
    alert(
      "Test cases have been fixed to meet the requirement of 3 visible and 2 hidden test cases. Please review them before continuing."
    );
  };

  if (!isClient) {
    return <div>Loading....</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Draft Status */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Create New Assessment
            </h1>
            <p className="text-gray-400 mt-2">
              Build your coding assessment in simple steps
            </p>
          </div>
          <div className="text-gray-400 text-sm flex items-center">
            {lastSaved ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Auto-saved at {lastSaved}
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                Draft not saved yet
              </>
            )}
          </div>
        </div>

        {/* Error Summary */}
        {showErrorSummary && Object.keys(errors).length > 0 && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-300 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Validation Errors
            </h2>
            <p className="text-red-200 mb-3">
              Please fix the following errors before proceeding:
            </p>
            <ul className="list-disc pl-5 text-red-200 space-y-1 max-h-60 overflow-auto">
              {Object.entries(errors).map(([key, message]) => (
                <li key={key}>
                  {message.toString()}
                  {key.includes("problem") && (
                    <button
                      className="ml-2 text-xs text-red-300 underline"
                      onClick={() => {
                        // Extract problem index if present
                        const match = key.match(/problem(\d+)/);
                        if (match && match[1] && activeStep === 1) {
                          // Switch to problems tab and highlight the problem
                          const problemIndex = parseInt(match[1]);
                          document
                            .getElementById(`problem-${problemIndex}`)
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                        }
                      }}
                    >
                      Scroll to this error
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex space-x-4">
              <button
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm"
                onClick={() => fixAllProblems()}
              >
                Fix All Problems
              </button>
              <button
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                onClick={() => setShowErrorSummary(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <ProgressSteps steps={steps} activeStep={activeStep} />

        {/* Main Content */}
        <div className="space-y-6 w-full">
          {activeStep === 0 && (
            <BasicDetails
              assessment={assessment}
              setAssessment={setAssessment}
              errors={errors}
            />
          )}

          {activeStep === 1 && (
            <ProblemsAndTestCases
              assessment={assessment}
              addProblem={addProblem}
              removeProblem={removeProblem}
              updateProblem={updateProblem}
              addTestCase={addTestCase}
              removeTestCase={removeTestCase}
              updateTestCase={updateTestCase}
              addLanguage={addLanguage}
              removeLanguage={removeLanguage}
              updateLanguage={updateLanguage}
              addChoice={addChoice}
              removeChoice={removeChoice}
              updateChoice={updateChoice}
              replaceProblem={replaceProblem}
              errors={errors}
              professorId={professorId}
              fixTestCases={fixTestCases}
              fixAllProblems={fixAllProblems}
            />
          )}

          {activeStep === 2 && (
            <Schedule
              assessment={assessment}
              setAssessment={setAssessment}
              errors={errors}
            />
          )}

          {activeStep === 3 && <Review assessment={assessment} />}

          <NavigationButtons
            activeStep={activeStep}
            steps={steps}
            handleNext={handleNext}
            setActiveStep={setActiveStep}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateAssessment;
