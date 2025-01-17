"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Code2, User, Lock, EyeOff, Eye } from "lucide-react";
import { Separator } from "@radix-ui/react-select";
import CollegeLoginFormSkeleton from "./LoginFormSkeleton";
import { loginHandler } from "@/actions/Signup";
import { toast } from "react-toastify";

export const LoginformSchema = z.object({
  studentId: z
    .string()
    .min(10, "Invalid Student Id format")
    .max(10, "Invalid Student Id format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .nonempty("Password is required"),
});

export type LoginFormData = z.infer<typeof LoginformSchema>;

const CollegeLoginForm = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginformSchema),
    defaultValues: {
      studentId: "",
      password: "",
    },
  });
  useEffect(() => {
    setIsClient(true); // Client-side only
  }, []);

  if (!isClient) {
    return <CollegeLoginFormSkeleton />; // Fallback for SSR
  }
  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log("Form submitted:", data);
      const result = await loginHandler({ role: "student", data: data });
      if (result == true) {
        router.push("/dashboard");
      } else {
        console.log(result);
        toast.error(result, {
          className: "bg-slate-800 text-white",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  };
  return (
    <Card className="w-full max-w-md bg-gray-900 border border-gray-800 shadow-2xl">
      <CardHeader className="space-y-1 border-b border-gray-800">
        <div className="flex items-center justify-between px-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <CardTitle className="text-xl text-center font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Login
          </CardTitle>
        </div>
        <div className="p-4 bg-gray-900">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <Code2 className="h-8 w-8 text-green-500" />
              <h1 className="text-xl font-bold text-green-500 font-mono">
                SICET Code Lab
              </h1>
            </div>
            <div className="text-center">
              <h2 className="text-lg text-gray-300 font-semibold">
                Sri Indu College of Engineering and Technology
              </h2>
              <p className="text-sm text-gray-500 font-mono mt-1">
                {"/* Empowering Future Innovators */"}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 my-4">
          {/* Student ID */}
          <div className="space-y-2">
            <Label className="text-slate-200 tracking-wide text-lg">
              <User className="h-4 w-4 inline mr-2" />
              student.id
            </Label>
            <Controller
              name="studentId"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  placeholder="Enter student ID...."
                  className="bg-slate-900 border-slate-700 text-green-500 font-semibold tracking-widest md:text-lg"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              )}
            />
            {errors.studentId && (
              <p className="text-red-500 text-md">{errors.studentId.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2 relative">
            <Label className="text-slate-200 tracking-wide md:text-lg ">
              <Lock className="h-4 w-4 inline mr-2" />
              student.password
            </Label>
            <div className="relative">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter password...."
                    type={showPassword ? "text" : "password"} // Toggle visibility
                    className="bg-slate-900 border-slate-700 text-slate-200 pr-10 tracking-widest md:text-lg"
                  />
                )}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-slate-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-md">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "$ executing login..." : "$ submit login()"}
          </Button>
          <Separator />
          <div className="text-center pt-2">
            <a
              href="/signup"
              className="font-mono text-md text-green-400 hover:text-green-300"
            >
              {"// Don't have an account? Register here"}
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CollegeLoginForm;
