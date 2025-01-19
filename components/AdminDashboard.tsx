"use client";
import React, { useState } from "react";
import {
  Plus,
  Clock,
  Calendar,
  Book,
  Code,
  Database,
  ArrowRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProfessorDashboard = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [testCases, setTestCases] = useState([
    { input: "", output: "", score: 0, isHidden: false },
  ]);
  const [assessment, setAssessment] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    duration: 120,
    totalQuestions: 1,
    topics: [],
    problems: [],
  });

  const steps = [
    "Basic Details",
    "Problems & Test Cases",
    "Schedule",
    "Review",
  ];

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      { input: "", output: "", score: 0, isHidden: false },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Create New Assessment
          </h1>
          <p className="text-gray-400 mt-2">
            Build your coding assessment in simple steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= activeStep
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                      : "bg-gray-700"
                  } text-white`}
                >
                  {index + 1}
                </div>
                <div className="ml-2">
                  <p
                    className={`${
                      index <= activeStep ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {step}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-0.5 mx-4 ${
                      index < activeStep
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                        : "bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {activeStep === 0 && (
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
                      className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-2.5"
                      placeholder="e.g., Data Structures Mid-Term"
                      value={assessment.title}
                      onChange={(e) =>
                        setAssessment({ ...assessment, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-2.5"
                      rows={4}
                      placeholder="Describe the assessment objectives and instructions..."
                      value={assessment.description}
                      onChange={(e) =>
                        setAssessment({
                          ...assessment,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Topics Covered
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-2.5"
                      placeholder="e.g., Arrays, Dynamic Programming, Trees (comma separated)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeStep === 1 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex justify-between items-center">
                  <span>Problems & Test Cases</span>
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    onClick={addTestCase}
                  >
                    <Plus size={16} /> Add Problem
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-medium">Problem 1</h3>
                      <div className="flex items-center gap-2">
                        <select className="bg-gray-600 text-white rounded-lg px-3 py-1">
                          <option>Easy</option>
                          <option>Medium</option>
                          <option>Hard</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <input
                        type="text"
                        className="w-full bg-gray-600 text-white rounded-lg p-2.5"
                        placeholder="Problem Title"
                      />
                      <textarea
                        className="w-full bg-gray-600 text-white rounded-lg p-2.5"
                        rows={4}
                        placeholder="Problem Description"
                      />

                      {/* Test Cases */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-white">Test Cases</h4>
                          <button
                            className="text-blue-400 text-sm flex items-center gap-1"
                            onClick={addTestCase}
                          >
                            <Plus size={14} /> Add Test Case
                          </button>
                        </div>

                        {testCases.map((testCase, index) => (
                          <div
                            key={index}
                            className="bg-gray-800 p-4 rounded-lg"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="text-white">
                                Test Case {index + 1}
                              </h5>
                              <button className="text-gray-400 hover:text-white">
                                <X size={16} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                  Input
                                </label>
                                <textarea
                                  className="w-full bg-gray-700 text-white rounded-lg p-2.5"
                                  rows={3}
                                  placeholder="Test case input"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                  Expected Output
                                </label>
                                <textarea
                                  className="w-full bg-gray-700 text-white rounded-lg p-2.5"
                                  rows={3}
                                  placeholder="Expected output"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <input
                                type="number"
                                className="w-24 bg-gray-700 text-white rounded-lg p-2"
                                placeholder="Score"
                              />
                              <label className="flex items-center gap-2 text-gray-400">
                                <input
                                  type="checkbox"
                                  className="rounded bg-gray-700"
                                />
                                Hidden Test Case
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeStep === 2 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Start Time
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="datetime-local"
                        className="w-full bg-gray-700 border-gray-600 text-white rounded-lg pl-10 p-2.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      End Time
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="datetime-local"
                        className="w-full bg-gray-700 border-gray-600 text-white rounded-lg pl-10 p-2.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Duration (minutes)
                    </label>
                    <div className="relative">
                      <Clock
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="number"
                        className="w-full bg-gray-700 border-gray-600 text-white rounded-lg pl-10 p-2.5"
                        placeholder="120"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              className={`px-4 py-2 rounded-lg ${
                activeStep === 0
                  ? "bg-gray-700 text-gray-400"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
              disabled={activeStep === 0}
            >
              Previous
            </button>
            <button
              onClick={() =>
                activeStep === steps.length - 1
                  ? console.log("Submit")
                  : setActiveStep(activeStep + 1)
              }
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              {activeStep === steps.length - 1 ? "Create Assessment" : "Next"}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;
