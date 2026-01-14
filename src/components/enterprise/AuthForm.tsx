"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  User as UserIcon,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";

type AuthMode = "login" | "register";
type UserType = "member" | "admin" | "staff";

interface AuthFormProps {
  mode: AuthMode;
  userType: UserType;
}

export function AuthForm({ mode, userType }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "levi@life.com",
    password: "Password123",
    name: "",
    confirmPassword: "",
  });

  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const organizationSlug = searchParams.get("slug") || "";
  const isRegister = mode === "register";
  const isAdmin = userType === "admin";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return false;
    }

    if (isRegister) {
      if (!formData.name) {
        setError("Please enter your name");
        return false;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters long");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const endpoint = isRegister ? "register" : "login";
      //   const response = await fetch(`/api/auth/${userType}/${endpoint}`, {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       email: formData.email,
      //       password: formData.password,
      //       ...(isRegister && { name: formData.name }),
      //     }),
      //   });
      const response = await apiClient.post(`/auth/${endpoint}`, {
        email: formData.email,
        password: formData.password,
        ...(isAdmin && isRegister && { organizationName: formData.name }),
        ...(isAdmin && isRegister && { organizationEmail: formData.email }),
        ...(isAdmin && isRegister && { firstName: formData.name }), // Include name for registration
        ...(isAdmin && isRegister && { lastName: formData.name }), // Include name for registration
      });
      const data = response.data;
      console.log("data", data);

      if (response.status !== 200) {
        throw new Error(data?.message || "Authentication failed");
      }
      // save token to local storage
      localStorage.setItem("token", data?.data?.access_token);

      router.push(redirectTo);
    } catch (err) {
      console.error("Authentication error:", err);
      setError(
        (err as Error).message || "An error occurred during authentication"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-gray-900 rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          {isOrg ? (
            <Building2 className="w-12 h-12 text-white" />
          ) : (
            <UserIcon className="w-12 h-12 text-white" />
          )}
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {isRegister ? "Create" : "Sign in to"}{" "}
          {isOrg ? "Organization" : "Member"} Account
        </h2>
        <p className="text-gray-400">
          {isRegister
            ? "Fill in the details to get started"
            : "Enter your credentials to continue"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/20 border border-red-500 text-red-200 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {isOrg ? "Organization Name" : "First Name"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isOrg ? "Acme Inc." : "John Doe"}
                  required
                />
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {isOrg ? "Organization Name" : "Last Name"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isOrg ? "Acme Inc." : "John Doe"}
                  required
                />
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              minLength={isRegister ? 8 : 1}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {isRegister && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        )}

        {!isRegister && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-300"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-500 hover:text-blue-400"
              >
                Forgot password?
              </a>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading
              ? "Processing..."
              : isRegister
              ? "Create Account"
              : "Sign in"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href={`/auth/${userType}/${isRegister ? "login" : "register"}${
              redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""
            }`}
            className="w-full flex justify-center py-2 px-4 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </div>
      </div>
    </div>
  );
}
