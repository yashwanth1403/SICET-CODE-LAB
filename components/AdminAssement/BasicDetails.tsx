"use client";
import { Assessment, ValidationErrors } from "../AdminDashboard";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BasicDetailsProps {
  assessment: Assessment;
  setAssessment: React.Dispatch<React.SetStateAction<Assessment>>;
  errors: ValidationErrors;
}

// Departments list
const DEPARTMENTS = [
  "CSE",
  "AIML",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Data Science",
  "Cybersecurity",
];

const BATCH_OPTIONS = ["2022-2026", "2023-2027", "2024-2028"];

// Basic Details Component
export const BasicDetails: React.FC<BasicDetailsProps> = ({
  assessment,
  setAssessment,
  errors,
}) => {
  // Add state for raw input
  const [topicsInput, setTopicsInput] = useState(assessment.topics.join(", "));

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Basic Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Assessment Title
            </label>
            <input
              type="text"
              className={`w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5 ${
                errors.title ? "border-red-500" : ""
              }`}
              placeholder="e.g., Data Structures Mid-Term"
              value={assessment.title}
              onChange={(e) =>
                setAssessment({ ...assessment, title: e.target.value })
              }
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Batches
            </label>
            <div className="bg-gray-700 rounded-lg p-2.5">
              {BATCH_OPTIONS.map((batch) => (
                <label key={batch} className="block mb-1 text-gray-300">
                  <input
                    type="checkbox"
                    className="mr-2 text-white"
                    checked={assessment.batches.includes(batch)}
                    onChange={(e) => {
                      const updatedBatches = e.target.checked
                        ? [...assessment.batches, batch]
                        : assessment.batches.filter((b) => b !== batch);
                      setAssessment({
                        ...assessment,
                        batches: updatedBatches,
                      });
                    }}
                  />
                  {batch}
                </label>
              ))}
            </div>
            {errors.batches && (
              <p className="text-red-500 text-sm mt-1">{errors.batches}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Departments
            </label>
            <div className="bg-gray-700 rounded-lg p-2.5">
              {DEPARTMENTS.map((dept) => (
                <label key={dept} className="block mb-1 text-gray-300">
                  <input
                    type="checkbox"
                    className="mr-2 text-white"
                    checked={assessment.departments.includes(dept)}
                    onChange={(e) => {
                      const updatedDepts = e.target.checked
                        ? [...assessment.departments, dept]
                        : assessment.departments.filter((d) => d !== dept);
                      setAssessment({
                        ...assessment,
                        departments: updatedDepts,
                      });
                    }}
                  />
                  {dept}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Topics Covered
            </label>
            <input
              type="text"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5"
              placeholder="e.g., Arrays, Dynamic Programming, Trees (comma separated)"
              value={topicsInput}
              onChange={(e) => {
                const newValue = e.target.value;
                setTopicsInput(newValue);

                // Update assessment.topics array
                setAssessment({
                  ...assessment,
                  topics: newValue
                    .split(",")
                    .map((topic) => topic.trim())
                    .filter(Boolean),
                });
              }}
              onBlur={() => {
                // Clean up on blur
                const cleanedTopics = topicsInput
                  .split(",")
                  .map((topic) => topic.trim())
                  .filter(Boolean);
                setTopicsInput(cleanedTopics.join(", "));
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
