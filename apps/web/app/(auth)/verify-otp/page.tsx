"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { auth } from "../../../services/auth";

export default function VerifyResetOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");

  const verifyMutation = useMutation({
    mutationFn: () => auth.verifyOtp(email.trim(), otp),
    onSuccess: () => {
      router.push(
        `/reset-password?email=${encodeURIComponent(email.trim())}&otp=${encodeURIComponent(otp)}`,
      );
    },
  });

  return (
    <main className="grid min-h-screen place-items-center bg-[#262626] px-4 py-6">
      <div className="w-full max-w-lg rounded-[20px] bg-[#080808] p-8 shadow-xl shadow-black/5">
        <h1 className="text-2xl font-semibold text-white">Verify reset code</h1>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Enter the six-digit code we sent to{" "}
          <span className="text-zinc-200">{email || "your email"}</span>. The
          code expires in 10 minutes.
        </p>

        {!email && (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Your email address is missing. Please request a new reset code.
          </p>
        )}

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            verifyMutation.mutate();
          }}>
          <label className="block text-sm text-zinc-300">
            Six-digit code
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-center text-xl tracking-[0.4em] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-white"
            />
          </label>

          {verifyMutation.error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {verifyMutation.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={!email || otp.length !== 6 || verifyMutation.isPending}
            className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60">
            {verifyMutation.isPending ? "Verifying..." : "Verify code"}
          </button>
        </form>

        <Link
          href="/forgot-password"
          className="mt-5 block text-center text-sm text-zinc-400 transition-colors hover:text-white">
          Request a new code
        </Link>
      </div>
    </main>
  );
}
