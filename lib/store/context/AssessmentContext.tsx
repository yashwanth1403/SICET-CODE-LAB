"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// Import from the existing testAssessment type definitions
import { TestAssessmentType } from "@/lib/store/atom/testAssessment";

// Create the context with default undefined value and proper typing
type AssessmentContextType = {
  assessment: TestAssessmentType | null;
  setAssessment: (assessment: TestAssessmentType | null) => void;
};

const AssessmentContext = createContext<AssessmentContextType | undefined>(
  undefined
);

// Provider component
export const AssessmentProvider = ({ children }: { children: ReactNode }) => {
  const [assessment, setAssessment] = useState<TestAssessmentType | null>(null);

  return (
    <AssessmentContext.Provider value={{ assessment, setAssessment }}>
      {children}
    </AssessmentContext.Provider>
  );
};

// Custom hook for using the context
export const useAssessment = (): AssessmentContextType => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error("useAssessment must be used within an AssessmentProvider");
  }
  return context;
};
