"use client";

export interface ITestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

export type ProgrammingLanguage =
  | "C"
  | "C++"
  | "Java"
  | "Python"
  | "JavaScript"
  | "TypeScript"
  | "Ruby"
  | "Go"
  | "Rust";

export interface IProblemLanguage {
  name: ProgrammingLanguage;
  functionSignature: string; // Added functionSignature
  codePrefix: string; // Added codePrefix
  starterCode: string;
  codeSuffix: string; // Added codeSuffix
}

export type QuestionType = "CODING" | "MULTIPLE_CHOICE";

export interface IQuestionChoice {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export interface IProblem {
  id: number;
  databaseId?: string; // Optional database ID for existing problems
  title: string;
  description: string;
  difficulty?: "Easy" | "Medium" | "Hard"; // Optional difficulty (only used for coding questions)
  score: number; // Score is now at the problem level
  questionType: QuestionType; // New field to identify question type
  testCases: ITestCase[]; // Used for coding questions
  languages: IProblemLanguage[]; // Used for coding questions
  choices?: IQuestionChoice[]; // New field for multiple choice questions
  assessmentId?: string; // Optional assessment ID for existing problems
}

export interface ValidationErrors {
  [key: string]: string;
}

export type UpdateTestCaseFunction = (
  problemIndex: number,
  testCaseIndex: number,
  field: keyof ITestCase,
  value: string | boolean
) => void;

export type UpdateLanguageFunction = (
  problemIndex: number,
  languageIndex: number,
  field: keyof IProblemLanguage,
  value: string
) => void;

export type UpdateChoiceFunction = (
  problemIndex: number,
  choiceIndex: number,
  field: keyof IQuestionChoice,
  value: string | boolean
) => void;

export interface Assessment {
  title: string;
  batches: string[];
  departments: string[];
  startTime: string;
  endTime: string;
  duration: number;
  totalQuestions: number;
  topics: string[];
  problems: IProblem[];
}
