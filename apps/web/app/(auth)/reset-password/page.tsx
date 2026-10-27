"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { auth } from "../../../services/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const otp = searchParams.get("otp") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetMutation = useMutation({
    mutationFn: () =>
      auth.resetPassword({
        email: email.trim(),
        otp,
        newPassword,
      }),

    onSuccess: (result) => {
      toast.success(result.message || "Password reset successfully.");
      router.replace("/login?passwordReset=success");
    },

    onError: (error) => {
      toast.error(error.message || "Unable to reset your password.");
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !/^\d{6}$/.test(otp)) {
      toast.error(
        "Your reset session is invalid. Please verify your code again.",
      );
      router.replace(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Your password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    resetMutation.mutate();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#262626] px-4 py-6">
      <div className="w-full max-w-lg rounded-[20px] bg-[#080808] p-8 shadow-xl shadow-black/5">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-[#111]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-6 w-6 text-white"
            aria-hidden="true">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <path d="M12 14v3" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-white">
          Reset your password
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Choose a strong new password for your account.
        </p>

        <p className="mt-4 break-all rounded-xl border border-zinc-800 bg-[#111] px-4 py-3 text-sm text-zinc-300">
          {email || "No email address provided"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-zinc-300">
            New password
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Confirm new password
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter your password again"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="accent-white"
            />
            Show passwords
          </label>

          <button
            type="submit"
            disabled={
              resetMutation.isPending ||
              !email ||
              !/^\d{6}$/.test(otp) ||
              !newPassword ||
              !confirmPassword
            }
            className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60">
            {resetMutation.isPending
              ? "Resetting password..."
              : "Reset password"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#262626] text-sm text-zinc-400">
          Loading...
        </main>
      }>
      <ResetPasswordForm />
    </Suspense>
  );
}
