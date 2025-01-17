"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Terminal,
  Code2,
  User,
  Lock,
  Phone,
  EyeOff,
  Eye,
  Mail,
} from "lucide-react";
import SignupFormSkeleton from "./SignupFormSkeleton";
import { signup } from "@/actions/Signup";
import { useRouter } from "next/navigation";

// Define validation schema using Zod
export const SignupformSchema = z
  .object({
    batch: z.string().nonempty("Batch is required"),
    year: z.string().nonempty("Year is required"),
    department: z.string().nonempty("department is required"),
    name: z.string().min(3, "Required 3 character"),
    rollNoPrefix: z.string().nonempty("Roll number prefix is required"),
    rollNoSuffix: z
      .string()
      .regex(/^\d{2}$/, "Suffix must be 2 digits")
      .nonempty("Roll number suffix is required"),
    email: z
      .string()
      .email("Invalid email address")
      .nonempty("Email is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .nonempty("Password is required"),
    confirmPassword: z.string().nonempty("Confirm password is required"),
    phoneNumber: z
      .string()
      .min(10, "Invalid number")
      .nonempty("PhoneNumber required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof SignupformSchema>;

const batches = ["2022-2026", "2021-2025", "2023-2027", "2024-2028"] as const;
const departmentes = ["AIML", "CSE", "AIDS"] as const;
const years = [
  { value: "1", label: "First Year" },
  { value: "2", label: "Second Year" },
  { value: "3", label: "Third Year" },
  { value: "4", label: "Fourth Year" },
];

const CollegeSignupForm = () => {
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(SignupformSchema),
    defaultValues: {
      batch: "",
      year: "",
      name: "",
      department: "",
      rollNoPrefix: "",
      rollNoSuffix: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    },
  });

  const selectedBatch = watch("batch");
  const selecteddepartment = watch("department");

  type Batch = (typeof batches)[number];
  type department = (typeof departmentes)[number];

  const getRollNoPrefixes = (
    selectedBatch: Batch,
    selecteddepartment: department
  ): string[] => {
    const prefixMap: Record<department, Record<Batch, string[]>> = {
      AIML: {
        "2022-2026": ["22D41A66", "23D45A66"],
        "2021-2025": ["21D14A66"],
        "2023-2027": ["23D14A66"],
        "2024-2028": ["24D14A66"],
      },
      CSE: {
        "2022-2026": ["22D14B66"],
        "2021-2025": ["21D14B66"],
        "2023-2027": ["23D14B66"],
        "2024-2028": ["24D14B66"],
      },
      AIDS: {
        "2022-2026": ["22D14C66"],
        "2021-2025": ["21D14C66"],
        "2023-2027": ["23D14C66"],
        "2024-2028": ["24D14C66"],
      },
    };

    return selectedBatch && selecteddepartment
      ? prefixMap[selecteddepartment]?.[selectedBatch] || []
      : [];
  };
  useEffect(() => {
    setIsClient(true); // Client-side only
  }, []);

  if (!isClient) {
    return <SignupFormSkeleton />;
  }
  const onSubmit = async (data: SignupFormData) => {
    try {
      console.log("Form submitted:", data);

      const result = await signup(data);
      if (result.success) {
        toast.success(
          "🎉 Registration completed! Please login into SICET Code Lab 🚀",
          {
            className: "text-white bg-slate-900",
            progressClassName: "fancy-progress-bar",
          }
        );
        setTimeout(() => {
          router.push("/login");
        }, 2500);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  return (
    <Card className="w-full max-w-sm bg-slate-800 border-slate-700 shadow-xl text-sm">
      <CardHeader className="space-y-0 p-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Code2 className="h-8 w-8 text-blue-500" />
            <CardTitle className="text-2xl text-center font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              SICET Code Lab
            </CardTitle>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center pt-2">
          Sri indu College of Engineering and Technology
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          {/* Batch */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <Terminal className="h-4 w-4 inline mr-2" />
              Batch
            </Label>
            <Controller
              name="batch"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {batches.map((b) => (
                      <SelectItem key={b} value={b} className="text-slate-200">
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.batch && (
              <p className="text-red-500 text-sm">{errors.batch.message}</p>
            )}
          </div>
          {/*Year of college*/}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <Terminal className="h-4 w-4 inline mr-2" />
              Year of College
            </Label>
            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {years.map((year) => (
                      <SelectItem
                        key={year.value}
                        value={year.value}
                        className="text-slate-200"
                      >
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.year && (
              <p className="text-red-500 text-sm">{errors.year.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">
              <Terminal className="h-4 w-4 inline mr-2" />
              Department
            </Label>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {departmentes.map((department) => (
                      <SelectItem
                        key={department}
                        value={department}
                        className="text-slate-200"
                      >
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.department && (
              <p className="text-red-500 text-sm">
                {errors.department.message}
              </p>
            )}
          </div>
          {/*Student ID */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <User className="h-4 w-4 inline mr-2" />
              Student ID
            </Label>
            <div className="flex gap-2">
              {/* Roll No Prefix */}
              <div className="flex-1">
                <Controller
                  name="rollNoPrefix"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      disabled={!watch("batch") || !watch("department")}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                        <SelectValue placeholder="Roll No Prefix" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {getRollNoPrefixes(
                          selectedBatch as Batch,
                          selecteddepartment as department
                        ).map((prefix) => (
                          <SelectItem
                            key={prefix}
                            value={prefix}
                            className="text-slate-200"
                          >
                            {prefix}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.rollNoPrefix && (
                  <p className="text-red-500 text-sm">
                    {errors.rollNoPrefix.message}
                  </p>
                )}
              </div>

              {/* Roll No Suffix */}
              <div className="w-24">
                <Controller
                  name="rollNoSuffix"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      className="bg-slate-900 border-slate-700 text-slate-200"
                      maxLength={2}
                      placeholder="XX"
                      disabled={!watch("rollNoPrefix")}
                    />
                  )}
                />
                {errors.rollNoSuffix && (
                  <p className="text-red-500 text-sm">
                    {errors.rollNoSuffix.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">
              <User className="h-4 w-4 inline mr-2" />
              Name
            </Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  placeholder="Enter Your name..."
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              )}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          {/* Email Field */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <Mail className="h-4 w-4 inline mr-2" />
              Email
            </Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="Enter your email..."
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              )}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">
              <Phone className="h-4 w-4 inline mr-2" />
              Phone Number
            </Label>
            <div className="flex items-center">
              <span className="text-slate-500 text-sm">+91</span>
              <Controller
                name="phoneNumber"
                control={control}
                rules={{
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Phone number must be 10 digits",
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    maxLength={10} // Limiting input to 10 digits after +91
                    className="ml-2 w-full bg-slate-900 border-slate-700 text-slate-200"
                    placeholder="Enter your number"
                  />
                )}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">
              <Lock className="h-4 w-4 inline mr-2" />
              Password
            </Label>
            <div className="relative">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    className="bg-slate-900 border-slate-700 text-slate-200 pr-10"
                  />
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">
              <Lock className="h-4 w-4 inline mr-2" />
              Confirm Password
            </Label>
            <div className="relative">
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type={showConfirmPassword ? "text" : "password"}
                    className="bg-slate-900 border-slate-700 text-slate-200 pr-10"
                  />
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? "$ executing signup..." : "$ submit signup()"}
          </Button>
          <div className="text-center pt-2">
            <a
              href="/login"
              className="font-mono text-sm text-green-400 hover:text-green-300"
            >
              {"// Already have an account? login here"}
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CollegeSignupForm;
