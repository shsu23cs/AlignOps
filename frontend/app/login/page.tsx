"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlignOpsApiError, setTokens, setStoredUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  const redirectByRole = useCallback((role: string) => {
    if (role === "EMPLOYEE") router.push("/employee/goals");
    else if (role === "MANAGER") router.push("/manager/dashboard");
    else router.push("/admin/dashboard");
  }, [router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if returning from SSO
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ssoAccessToken = params.get("accessToken");
      const ssoRefreshToken = params.get("refreshToken");
      const ssoUserRaw = params.get("user");
      
      if (ssoAccessToken && ssoRefreshToken && ssoUserRaw) {
        try {
          const ssoUser = JSON.parse(decodeURIComponent(ssoUserRaw));
          setTokens(ssoAccessToken, ssoRefreshToken);
          setStoredUser(ssoUser);
          // Reload to let AuthProvider pick it up
          window.location.href = "/";
          return;
        } catch (e) {
          setError("Failed to complete SSO login.");
        }
      }
    }

    if (!isLoading && user) {
      redirectByRole(user.role);
    }
  }, [user, isLoading, redirectByRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // redirect handled by the useEffect above once user state updates
    } catch (err) {
      if (err instanceof AlignOpsApiError) {
        setError(err.apiError.message);
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSsoClick = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}/auth/sso/microsoft`;
  };

  if (isLoading) return null; // avoid flash before rehydration

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-canvas)" }}>
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl font-bold mb-3"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-primary-700)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            AlignOps
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
            Goal Setting &amp; Tracking Portal
          </p>
        </div>

        {/* Login Card */}
        <div
          className="p-8"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: "var(--color-text-primary)" }}>
            Sign In
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block mb-2"
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-semibold)",
                  color: "var(--color-text-primary)",
                }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={submitting}
                className="w-full"
                style={{
                  padding: "10px 14px",
                  border: "1.5px solid var(--color-border-strong)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-base)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  transition: "border-color var(--duration-base) var(--ease-standard), box-shadow var(--duration-base) var(--ease-standard)",
                  opacity: submitting ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-primary-500)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(46,100,80,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border-strong)";
                  e.target.style.boxShadow = "none";
                }}
              />

            </div>

            {/* Password */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block mb-2"
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-semibold)",
                  color: "var(--color-text-primary)",
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
                className="w-full"
                style={{
                  padding: "10px 14px",
                  border: "1.5px solid var(--color-border-strong)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-base)",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  transition: "border-color var(--duration-base) var(--ease-standard), box-shadow var(--duration-base) var(--ease-standard)",
                  opacity: submitting ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-primary-500)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(46,100,80,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border-strong)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 p-3"
                style={{
                  background: "var(--color-danger-bg)",
                  borderLeft: "3px solid var(--color-danger)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-danger)",
                }}
              >
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-sign-in"
              type="submit"
              disabled={submitting}
              className="w-full"
              style={{
                padding: "12px 24px",
                background: submitting ? "var(--color-primary-400)" : "var(--color-primary-500)",
                color: "var(--color-text-inverse)",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--weight-semibold)",
                letterSpacing: "var(--tracking-wide)",
                textTransform: "uppercase",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "background var(--duration-base) var(--ease-standard)",
              }}
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>

            {/* SSO Button (Bonus Feature placeholder) */}
            <div className="mt-4">
              <button
                id="btn-sso"
                type="button"
                onClick={handleSsoClick}
                className="w-full"
                style={{
                  padding: "12px 24px",
                  background: "var(--color-surface)",
                  color: "var(--color-primary-500)",
                  border: "1.5px solid var(--color-primary-500)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-semibold)",
                  letterSpacing: "var(--tracking-wide)",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background var(--duration-base) var(--ease-standard)",
                  opacity: 0.9,
                }}
                title="Microsoft Entra ID SSO"
              >
                Sign in with Microsoft
              </button>
            </div>
          </form>
        </div>


      </div>
    </div>
  );
}
