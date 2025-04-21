import NextAuth, {
  type NextAuthConfig,
  DefaultSession,
  Session,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./lib/db";
import type { DefaultJWT } from "@auth/core/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      collegeId: string;
      contact: string;
      role: UserRole;
      batch?: string;
      department?: string;
    } & DefaultSession["user"];
  }

  interface User {
    collegeId: string;
    contact: string;
    role: UserRole;
    batch?: string;
    department?: string;
  }

  interface JWT extends DefaultJWT {
    collegeId: string;
    contact: string;
    role: UserRole;
    batch?: string;
    department?: string;
  }
}

type UserRole = "student" | "admin";

interface AuthUser {
  id: string;
  name: string;
  collegeId: string;
  contact: string;
  role: UserRole;
  batch?: string;
  department?: string;
}

const AUTH_ERRORS = {
  MISSING_CREDENTIALS: "Please provide all required credentials",
  INVALID_STUDENT:
    "Invalid student ID. Please register if you have not already.",
  INVALID_PROFESSOR:
    "Invalid Professor ID. Please register if you have not already.",
  INVALID_CREDENTIALS: "Invalid credentials",
  MISSING_USER_DATA: "Required user data is missing",
} as const;

const userFetchers = {
  student: async (id: string): Promise<AuthUser | null> => {
    const user = await prisma.student.findFirst({
      where: { studentId: id },
      select: {
        id: true,
        studentId: true,
        name: true,
        password: true,
        email: true,
        batch: true,
        department: true,
      },
    });

    if (!user?.name || !user?.email) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      collegeId: user.studentId,
      contact: user.email,
      role: "student" as const,
      batch: user.batch,
      department: user.department,
    };
  },

  admin: async (id: string): Promise<AuthUser | null> => {
    const user = await prisma.professor.findFirst({
      where: { professorId: id },
      select: {
        id: true,
        name: true,
        password: true,
        email: true,
        professorId: true,
      },
    });

    if (!user?.name || !user?.email) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      collegeId: user.professorId,
      contact: user.email,
      role: "admin" as const,
    };
  },
};

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        id: {
          label: "Id",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
        role: {
          label: "Role",
          type: "text",
        },
      },
      async authorize(credentials) {
        try {
          const { id, password, role } = credentials as Record<string, string>;

          if (!id || !password || !role) {
            throw new Error(AUTH_ERRORS.MISSING_CREDENTIALS);
          }

          if (role !== "student" && role !== "admin") {
            throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
          }
          const fetchUser = await (role === "student"
            ? userFetchers.student(id)
            : userFetchers.admin(id));

          if (!fetchUser) {
            throw new Error(
              role === "student"
                ? AUTH_ERRORS.INVALID_STUDENT
                : AUTH_ERRORS.INVALID_PROFESSOR
            );
          }

          const dbUser =
            role === "student"
              ? await prisma.student.findFirst({
                  where: { studentId: id },
                  select: { password: true },
                })
              : await prisma.professor.findFirst({
                  where: { professorId: id },
                  select: { password: true },
                });

          if (!dbUser?.password) {
            throw new Error(AUTH_ERRORS.MISSING_USER_DATA);
          }

          const isValidPassword = await compare(password, dbUser.password);
          if (!isValidPassword) {
            throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
          }

          return fetchUser;
        } catch (error) {
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          collegeId: user.collegeId,
          contact: user.contact,
          role: user.role,
          batch: user.batch,
          department: user.department,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          collegeId: token.collegeId as string,
          contact: token.contact as string,
          role: token.role as UserRole,
          batch: token.batch as string,
          department: token.department as string,
        },
      } as Session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
