"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { auth } from "../../../services/auth";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const requestMutation = useMutation({
    mutationFn: auth.forgotPassword,

    onSuccess: (result) => {
      toast.success(
        result.message || "If your account exists, a reset code has been sent.",
      );

      router.push(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
    },

    onError: (error) => {
      toast.error(error.message || "Unable to send reset code.");
    },
  });

  return (
    <main className="grid min-h-screen place-items-center bg-[#262626] px-4 py-6">
      <div className="w-full max-w-lg rounded-[20px] bg-[#080808] p-8 shadow-xl shadow-black/5">
        <h1 className="text-2xl font-semibold text-white">Forgot password?</h1>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          No worries. Enter the email address associated with your account and
          we’ll send you a six-digit password reset code.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            requestMutation.mutate(email.trim());
          }}>
          <label className="block text-sm text-zinc-300">
            Email address
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white"
            />
          </label>

          {requestMutation.error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {requestMutation.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={requestMutation.isPending || !email.trim()}
            className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60">
            {requestMutation.isPending ? "Sending code..." : "Send reset code"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-5 block text-center text-sm text-zinc-400 transition-colors hover:text-white">
          Back to login
        </Link>
      </div>
    </main>
  );
}
