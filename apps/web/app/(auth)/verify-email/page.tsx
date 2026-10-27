"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { auth } from "../../../services/auth";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const verifyQuery = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => auth.verifyEmail(token!),
    enabled: Boolean(token),
    retry: false,
  });

  const status = !token
    ? "error"
    : verifyQuery.isPending
      ? "loading"
      : verifyQuery.isSuccess
        ? "success"
        : "error";

  const message = !token
    ? "Verification link is invalid or expired."
    : verifyQuery.isSuccess
      ? verifyQuery.data.message || "Your email has been verified successfully."
      : verifyQuery.isError
        ? verifyQuery.error instanceof Error
          ? verifyQuery.error.message
          : "Unable to verify your email."
        : "";

  return (
    <main className="grid min-h-screen place-items-center bg-[#262626] px-4 py-6">
      <div className="w-full max-w-lg rounded-[20px] bg-[#080808] p-8 text-center shadow-xl">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
            <h1 className="text-2xl font-semibold text-white">
              Verifying your email
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-3xl text-emerald-400">
              ✓
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Email verified!
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{message}</p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200">
              Continue to login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-red-500/15 text-3xl text-red-400">
              !
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Verification failed
            </h1>
            <p className="mt-3 text-sm leading-6 text-red-400">{message}</p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200">
              Back to login
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
