"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Code2,
  Cpu,
  BookOpen,
  Laptop,
  Users,
  ChevronRight,
  Rocket,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden relative">
      {/* Animated background dots */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-blue-500/10"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 2}px`,
                height: `${Math.random() * 10 + 2}px`,
                animation: `pulse ${Math.random() * 5 + 3}s infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center py-6 px-8 md:px-12">
        <div className="flex items-center space-x-2">
          <Code2 className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            SICET Code Lab
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button
              variant="outline"
              className="border-blue-500 text-blue-700 hover:bg-blue-950 hover:text-white"
            >
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700 text-blue-400 text-sm font-medium">
              Powered by AI SICET Club
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="block">Sri Indu College</span>
              <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Coding Platform
              </span>
            </h2>
            <p className="text-lg text-slate-300">
              An innovative learning platform developed by the AI SICET Club at
              Sri Indu College of Engineering and Technology. Practice coding,
              take assessments, and enhance your programming skills.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Get Started <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-700 bg-slate-800/50 hover:bg-slate-700/50"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden md:block relative">
            <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 opacity-20 blur-xl"></div>
            <Card className="relative bg-slate-800/90 border-slate-700 shadow-xl overflow-hidden rounded-xl border">
              <div className="p-6 space-y-6">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="font-mono text-sm text-blue-400">
                  <div className="typing-text">
                    <span className="text-green-400">
                      {/* SICET Code Lab */}
                    </span>
                    <br />
                    <span className="text-purple-400">function</span>{" "}
                    <span className="text-yellow-400">solveChallenge</span>(){" "}
                    {"{"}
                    <br />
                    &nbsp;&nbsp;<span className="text-purple-400">
                      const
                    </span>{" "}
                    skills = [
                    <span className="text-green-400">&apos;Python&apos;</span>,{" "}
                    <span className="text-green-400">&apos;Java&apos;</span>,{" "}
                    <span className="text-green-400">&apos;C++&apos;</span>];
                    <br />
                    &nbsp;&nbsp;<span className="text-purple-400">
                      return
                    </span>{" "}
                    <span className="text-blue-300">success</span>;
                    <br />
                    {"}"}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Developed with <span className="text-blue-400">Innovation</span> by AI
          SICET Club
        </h3>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-600 transition-all p-6">
            <Cpu className="h-10 w-10 text-blue-500 mb-4" />
            <h4 className="text-xl font-bold mb-2 text-white">AI-Powered</h4>
            <p className="text-slate-300">
              Cutting-edge AI technology to enhance your coding experience and
              provide intelligent feedback.
            </p>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-600 transition-all p-6">
            <BookOpen className="h-10 w-10 text-blue-500 mb-4" />
            <h4 className="text-xl font-bold mb-2 text-white">
              Comprehensive Learning
            </h4>
            <p className="text-slate-300">
              Practice with a wide range of programming challenges and
              assessments designed by experts.
            </p>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-600 transition-all p-6">
            <Laptop className="h-10 w-10 text-blue-500 mb-4" />
            <h4 className="text-xl font-bold mb-2 text-white">
              Real-time Feedback
            </h4>
            <p className="text-slate-300">
              Get instant feedback on your code submissions to improve your
              programming skills.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 border-t border-slate-800 py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="flex items-center space-x-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              <p className="text-slate-300">
                <span className="font-bold text-white">
                  Sri Indu College of Engineering and Technology
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400 text-sm">© 2025 AI SICET Club</span>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.2);
          }
        }

        .typing-text {
          animation: typing 4s steps(40) infinite;
          white-space: pre-wrap;
        }

        @keyframes typing {
          from {
            opacity: 0.7;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
