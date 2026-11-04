"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function ErrorPage() {
  const searchParams = useSearchParams();

  const message =
    searchParams.get("message") || "Something went wrong. Please try again.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>

        <h1 className="text-xl font-semibold">Something went wrong</h1>

        <p className="mt-3 text-sm leading-6 text-neutral-400">{message}</p>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200">
            <RefreshCw size={16} />
            Try again
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-lg border border-neutral-800 px-4 py-3 text-sm text-neutral-300 transition hover:bg-neutral-900">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
