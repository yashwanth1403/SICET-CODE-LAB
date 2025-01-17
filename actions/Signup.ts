"use server";
import prisma from "@/lib/db";
import bcryptjs from "bcryptjs";
import { SignupFormData } from "@/components/CollegeSignupForm";
import { z } from "zod";
import { LoginFormData } from "@/components/CollegeLoginForm";
import { signIn } from "@/auth";
import { CredentialsSignin } from "next-auth";
import { AdminLoginFormData } from "@/components/AdminLogin";
import { AdminSignupFormData } from "@/components/AdminSignupForm";

const SignupformInputs = z
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
export async function signup(data: SignupFormData) {
  try {
    // Validate input
    console.log(data);
    const validatedData = SignupformInputs.safeParse(data);
    if (validatedData.success) {
      const { rollNoPrefix, rollNoSuffix } = data;
      const studentId = `${rollNoPrefix}${rollNoSuffix}`;
      // Check if student already exists
      const existingStudent = await prisma.student.findUnique({
        where: { studentId: studentId },
      });

      if (existingStudent) {
        return {
          success: false,
          error: "Student ID already registered",
        };
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(
        validatedData.data.password,
        10
      );

      // Create new student
      const student = await prisma.student.create({
        data: {
          studentId: studentId,
          name: validatedData.data.name,
          password: hashedPassword,
          PhoneNumber: validatedData.data.phoneNumber,
          batch: validatedData.data.batch,
          email: validatedData.data.email,
          department: validatedData.data.department,
        },
      });

      return {
        success: true,
        message: "Your account is successfully created 🚀",
        student: {
          studentId: student.studentId,
          batch: student.batch,
          department: student.department,
        },
      };
    } else {
      return {
        success: false,
        error: "Invalid Input Format",
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    console.error(error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

type LoginData =
  | { role: "student"; data: LoginFormData }
  | { role: "admin"; data: AdminLoginFormData };
export async function loginHandler({ role, data }: LoginData) {
  try {
    if (role == "student") {
      if (!data.studentId || !data.password) return "please provide all fields";
      await signIn("credentials", {
        id: data.studentId,
        password: data.password,
        role: role,
        redirect: false, // Prevent automatic redirect
      });
      return true;
    } else {
      if (!data.professorId || !data.password)
        return "please provide all fields";
      await signIn("credentials", {
        id: data.professorId,
        password: data.password,
        role: role,
        redirect: false, // Prevent automatic redirect
      });
      return true;
    }
  } catch (error) {
    const err = error as CredentialsSignin;
    return err.cause?.err?.message;
  }
}

const AdminSignupInputs = z
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
export async function AdminSignupHandler(data: AdminSignupFormData) {
  try {
    // Validate input
    console.log(data);
    const validatedData = AdminSignupInputs.safeParse(data);
    if (validatedData.success) {
      // Check if student already exists
      const existingProfessor = await prisma.professor.findUnique({
        where: { professorId: data.professorId },
      });

      if (existingProfessor) {
        return {
          success: false,
          error: "Professor ID already registered",
        };
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(
        validatedData.data.password,
        10
      );

      // Create new professor
      const Professor = await prisma.professor.create({
        data: {
          professorId: validatedData.data.professorId,
          name: validatedData.data.name,
          password: hashedPassword,
          email: validatedData.data.email,
          department: validatedData.data.department,
        },
      });

      return {
        success: true,
        message: "Your account is successfully created 🚀",
        Professor: {
          ProfessorId: Professor.professorId,
          email: Professor.email,
          department: Professor.department,
        },
      };
    } else {
      return {
        success: false,
        error: "Invalid Input Format",
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    console.error(error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
