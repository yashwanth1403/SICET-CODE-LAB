import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Code, FileText, Timer } from "lucide-react";

const Assessment = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
        Coding Assessments
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Assessment Card 1 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Code size={20} className="text-blue-500" />
              Data Structures Assessment
            </CardTitle>
            <p className="text-gray-400 text-sm">DSA-101</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Timer size={16} className="text-blue-500" />
                Duration: 90 minutes
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FileText size={16} className="text-blue-500" />
                Questions: 5
              </div>
              <div className="text-gray-300 mt-4">
                Topics covered:
                <ul className="list-disc list-inside text-gray-400 mt-2">
                  <li>Binary Trees</li>
                  <li>Graph Algorithms</li>
                  <li>Dynamic Programming</li>
                </ul>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                Start Assessment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Card 2 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Code size={20} className="text-blue-500" />
              Algorithms Practice
            </CardTitle>
            <p className="text-gray-400 text-sm">ALG-201</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Timer size={16} className="text-blue-500" />
                Duration: 120 minutes
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FileText size={16} className="text-blue-500" />
                Questions: 3
              </div>
              <div className="text-gray-300 mt-4">
                Topics covered:
                <ul className="list-disc list-inside text-gray-400 mt-2">
                  <li>Sorting Algorithms</li>
                  <li>Searching Techniques</li>
                  <li>Time Complexity</li>
                </ul>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                Start Assessment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Card 3 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Code size={20} className="text-blue-500" />
              Advanced Programming
            </CardTitle>
            <p className="text-gray-400 text-sm">PRG-301</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Timer size={16} className="text-blue-500" />
                Duration: 150 minutes
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <FileText size={16} className="text-blue-500" />
                Questions: 4
              </div>
              <div className="text-gray-300 mt-4">
                Topics covered:
                <ul className="list-disc list-inside text-gray-400 mt-2">
                  <li>System Design</li>
                  <li>Object-Oriented Programming</li>
                  <li>Design Patterns</li>
                </ul>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                Start Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Assessment;
