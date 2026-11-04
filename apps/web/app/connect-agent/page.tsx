"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Monitor, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

export default function ConnectAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userCode = searchParams.get("code");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    if (!userCode) {
      setError("Pairing code is missing.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/v1/agent/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Device approval failed.");
      }

      setSuccess(true);

      // Show success message before returning to dashboard.
      setTimeout(() => {
        router.replace("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-8 shadow-2xl">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-black">
          {success ? <CheckCircle2 size={24} /> : <Monitor size={24} />}
        </div>

        <p className="mb-2 text-sm text-zinc-500">DESKTOP AGENT</p>

        <h1 className="text-2xl font-semibold tracking-tight">
          {success ? "Device connected" : "Connect your device"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {success
            ? "Your desktop agent has been approved. Redirecting to your dashboard..."
            : "A desktop agent is requesting permission to connect to your account. Confirm the pairing code before approving."}
        </p>

        {!success && (
          <>
            <div className="mt-8 rounded-xl border border-white/10 bg-white/4 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
                <ShieldCheck size={16} />
                Pairing code
              </div>

              <div className="text-center font-mono text-3xl font-semibold tracking-[0.2em]">
                {userCode || "NO CODE"}
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            <button
              onClick={handleApprove}
              disabled={loading || !userCode}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                "Approve & Connect"
              )}
            </button>
          </>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
            <CheckCircle2 size={16} className="mr-2 inline" />
            Device approval successful.
          </div>
        )}

        <p className="mt-6 text-center text-xs text-zinc-600">
          Only approve devices you initiated.
        </p>
      </div>
    </main>
  );
}
