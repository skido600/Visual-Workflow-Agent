"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { login } from "../services/google-auth";

export default function GoogleAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const result = await login();

      if (result.success && result.url) {
        router.push(result.url);
        return;
      }

      toast.error(result.error || "Google sign-in failed.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      aria-busy={loading}
      className="group flex w-full items-center justify-center gap-3
        rounded-lg border border-zinc-300 bg-white px-4 py-3
        text-sm font-semibold text-zinc-800 shadow-sm
        transition-all duration-200
        hover:border-zinc-400 hover:bg-zinc-50 hover:shadow
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-blue-500 focus-visible:ring-offset-2
        active:scale-[0.99]
        disabled:cursor-not-allowed disabled:opacity-60
        dark:border-zinc-700 dark:bg-zinc-900
        dark:text-zinc-100 dark:hover:bg-zinc-800">
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full
              border-2 border-zinc-300 border-t-zinc-800
              dark:border-zinc-600 dark:border-t-white"
          />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          <FcGoogle
            size={21}
            className="transition-transform duration-200
              group-hover:scale-110"
          />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}
