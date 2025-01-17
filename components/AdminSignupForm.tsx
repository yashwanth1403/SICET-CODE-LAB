"use client";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Code2,
  User,
  Lock,
  Mail,
  Building,
  BookOpen,
  IdCard,
} from "lucide-react";
import SignupFormSkeleton from "./SignupFormSkeleton";
import { AdminSignupHandler } from "@/actions/Signup";
import { toast } from "react-toastify";

// Define validation schema using Zod
const adminSignupSchema = z
  .object({
    professorId: z
      .string()
      .min(5, "Professor ID must be at least 5 characters")
      .regex(
        /^[A-Z0-9]+$/,
        "Professor ID must contain only uppercase letters and numbers"
      )
      .nonempty("Professor ID is required"),
    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .nonempty("Name is required"),
    email: z
      .string()
      .email("Invalid email address")
      .nonempty("Email is required"),
    department: z.string().nonempty("Department is required"),
    subject: z.string().nonempty("Subject is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .nonempty("Password is required"),
    confirmPassword: z.string().nonempty("Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type AdminSignupFormData = z.infer<typeof adminSignupSchema>;

const AdminSignupForm = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const departments = ["AIML", "CSE", "AIDS", "IT", "ECE", "MECH"] as const;
  const subjects = [
    "Data Structures",
    "Algorithms",
    "Database Management",
    "Operating Systems",
    "Computer Networks",
    "Machine Learning",
    "Web Development",
    "Software Engineering",
    "Artificial Intelligence",
    "Cloud Computing",
  ] as const;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminSignupFormData>({
    resolver: zodResolver(adminSignupSchema),
    defaultValues: {
      professorId: "",
      name: "",
      email: "",
      department: "",
      subject: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: AdminSignupFormData) => {
    try {
      console.log("Form submitted:", data);

      const result = await AdminSignupHandler(data);
      if (result.success) {
        toast.success(
          "🎉 Registration completed! Please login into SICET Code Lab 🚀",
          {
            className: "text-white bg-slate-900",
            progressClassName: "fancy-progress-bar",
          }
        );
        setTimeout(() => {
          router.push("/admin/login");
        }, 2500);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <SignupFormSkeleton />;
  }

  return (
    <Card className="w-full max-w-sm bg-slate-800 border-slate-700 shadow-xl">
      <CardHeader className="space-y-0">
        <div className="flex items-center justify-between px-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Code2 className="h-8 w-8 text-blue-500" />
            <CardTitle className="text-2xl text-center font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Admin Registration
            </CardTitle>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center pt-2">
          Create new administrator account
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          {/* Professor ID */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <IdCard className="h-4 w-4 inline mr-2" />
              Professor ID
            </Label>
            <Controller
              name="professorId"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter professor ID"
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              )}
            />
            {errors.professorId && (
              <p className="text-red-500 text-sm">
                {errors.professorId.message}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <User className="h-4 w-4 inline mr-2" />
              Full Name
            </Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter admin name"
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              )}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <Mail className="h-4 w-4 inline mr-2" />
              Email Address
            </Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="admin@college.edu"
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              )}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <Building className="h-4 w-4 inline mr-2" />
              Department
            </Label>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept}
                        value={dept}
                        className="text-slate-200"
                      >
                        {dept}
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

          {/* Subject */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <BookOpen className="h-4 w-4 inline mr-2" />
              Subject
            </Label>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {subjects.map((subject) => (
                      <SelectItem
                        key={subject}
                        value={subject}
                        className="text-slate-200"
                      >
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.subject && (
              <p className="text-red-500 text-sm">{errors.subject.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <Lock className="h-4 w-4 inline mr-2" />
              Password
            </Label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="password"
                  placeholder="Enter password"
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              )}
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              <Lock className="h-4 w-4 inline mr-2" />
              Confirm Password
            </Label>
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="password"
                  placeholder="Confirm password"
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              )}
            />
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
            {isSubmitting ? "$ creating admin..." : "$ create_admin()"}
          </Button>

          <div className="text-center pt-2">
            <a
              href="/admin/login"
              className="font-mono text-sm text-green-400 hover:text-green-300"
            >
              {"// Already registered? Login here"}
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminSignupForm;
