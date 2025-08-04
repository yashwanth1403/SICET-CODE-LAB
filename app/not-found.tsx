"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [stars, setStars] = useState<
    Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      speed: number;
    }>
  >([]);
  const [asteroidPosition, setAsteroidPosition] = useState({ x: -100, y: 50 });

  // Generate random stars on component mount
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 0.1 + Math.random() * 0.3,
          opacity: 0.2 + Math.random() * 0.8,
          speed: 0.05 + Math.random() * 0.2,
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, []);

  // Animate stars and asteroid
  useEffect(() => {
    const intervalId = setInterval(() => {
      setStars((prevStars) =>
        prevStars.map((star) => ({
          ...star,
          x: star.x > 100 ? 0 : star.x + star.speed,
        }))
      );

      setAsteroidPosition((prev) => ({
        x: prev.x < 110 ? prev.x + 0.4 : -100,
        y: prev.y + Math.sin(prev.x / 20) * 0.5,
      }));
    }, 50);

    return () => clearInterval(intervalId);
  }, []);

  const errorCodes = [
    "ERR_PAGE_NOT_Found",
    "SEGMENTATION_FAULT",
    "ERRNO_404",
    "NULL_POINTER_EXCEPTION",
    "UNEXPECTED_EOF",
  ];

  const errorMessages = [
    "The page you are looking for has been lost in space.",
    "Your request has drifted into a black hole.",
    "Houston, we have a problem. The page cannot be located.",
    "The requested URL has been ejected from our server.",
    "This cosmic sector is uncharted territory.",
  ];

  // Pick random error code and message
  const randomError = errorCodes[Math.floor(Math.random() * errorCodes.length)];
  const randomMessage =
    errorMessages[Math.floor(Math.random() * errorMessages.length)];

  return (
    <div className="h-screen w-full bg-gradient-to-b from-slate-950 to-indigo-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Stars */}
      {stars.map((star, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}rem`,
            height: `${star.size}rem`,
            opacity: star.opacity,
            boxShadow: `0 0 ${star.size * 5}px ${
              star.size * 2
            }px rgba(255, 255, 255, ${star.opacity})`,
          }}
        />
      ))}

      {/* Asteroid */}
      <div
        className="absolute w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full transform -rotate-12"
        style={{
          left: `${asteroidPosition.x}%`,
          top: `${asteroidPosition.y}%`,
          boxShadow:
            "inset -5px -5px 15px rgba(0,0,0,0.6), 2px 2px 10px rgba(255,255,255,0.1)",
        }}
      >
        <div className="absolute w-3 h-3 bg-gray-700 rounded-full top-2 left-4"></div>
        <div className="absolute w-4 h-4 bg-gray-700 rounded-full top-8 left-8"></div>
        <div className="absolute w-2 h-2 bg-gray-700 rounded-full top-5 left-10"></div>
      </div>

      {/* Content */}
      <div className="z-10 text-center px-4 max-w-2xl">
        <div className="flex items-center justify-center mb-4">
          <div className="w-24 h-24 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-red-600 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-slate-950"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-bold text-red-500">404</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-mono text-cyan-400 mb-2 animate-pulse">
          &lt;{randomError}/&gt;
        </h1>

        <p className="text-xl md:text-2xl font-bold text-white mb-6 tracking-tight">
          {randomMessage}
        </p>

        <div className="font-mono text-sm md:text-base bg-slate-800/50 p-4 rounded-lg border border-slate-700/60 max-w-md mx-auto mb-8 text-left">
          <p className="text-slate-400">
            <span className="text-cyan-500">&gt;</span>{" "}
            <span className="text-green-400">debug</span>:
            <span className="text-red-400"> coordinates_not_found</span>
          </p>
          <p className="text-slate-400">
            <span className="text-cyan-500">&gt;</span>{" "}
            <span className="text-green-400">status</span>:
            <span className="text-red-400"> 404_not_found</span>
          </p>
          <p className="text-slate-400">
            <span className="text-cyan-500">&gt;</span>{" "}
            <span className="text-green-400">solution</span>:
            <span className="text-yellow-400">
              {" "}
              return_to_known_coordinates
            </span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 justify-center">
          <Button
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2 rounded-lg flex items-center justify-center group transition-all"
          >
            <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>

          <Link href="/">
            <Button className="bg-gradient-to-r from-cyan-700 to-cyan-900 hover:from-cyan-600 hover:to-cyan-800 text-white px-6 py-2 rounded-lg flex items-center justify-center group transition-all">
              <Home className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Return Home
            </Button>
          </Link>

          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-600 hover:to-indigo-800 text-white px-6 py-2 rounded-lg flex items-center justify-center group transition-all"
          >
            <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            Reload Page
          </Button>
        </div>
      </div>

      {/* Glow effect at the bottom */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-cyan-500/10 to-transparent"></div>
    </div>
  );
}
