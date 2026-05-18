import { z } from "zod";

export const LoginBodySchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).trim().toLowerCase(),
  password: z.string().min(1, { message: "Password is required." }),
});

export const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1, { message: "Refresh token is required." }),
});

export const LogoutBodySchema = z.object({
  refreshToken: z.string().min(1, { message: "Refresh token is required." }),
});

export type LoginBody = z.infer<typeof LoginBodySchema>;
export type RefreshBody = z.infer<typeof RefreshBodySchema>;
export type LogoutBody = z.infer<typeof LogoutBodySchema>;

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    managerId: string | null;
  };
}
