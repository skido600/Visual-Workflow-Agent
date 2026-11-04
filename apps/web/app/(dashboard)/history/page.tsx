"use client";

import { useQuery } from "@tanstack/react-query";
import {
  History,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Folder,
  Terminal,
} from "lucide-react";

type ExecutionResult = {
  action?: string;
  success?: boolean;
  result?: {
    path?: string;
    status?: string;
    created?: boolean;
    message?: string;
    success?: boolean;
  };
};

type PlanStatus = "completed" | "rejected" | "failed";

type HistoryItem = {
  id: string;
  goal: string;
  status: PlanStatus;
  executionResult: ExecutionResult[] | null;
  createdAt: string;
  updatedAt: string;
};

type HistoryResponse = {
  success: boolean;
  message?: string;
  data: HistoryItem[];
};

async function getHistory(): Promise<HistoryItem[]> {
  const response = await fetch("/api/v1/agent/history", {
    method: "GET",
    credentials: "include",
  });

  const result: HistoryResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Could not retrieve history.");
  }

  return result.data ?? [];
}

const statusStyles: Record<PlanStatus, string> = {
  completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  rejected: "border-neutral-700 bg-neutral-800 text-neutral-400",
  failed: "border-red-500/20 bg-red-500/10 text-red-400",
};

function formatDate(date: string) {
  if (!date) return "Unknown date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Unknown date";

  // UTC formatting keeps server and browser output consistent.
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}

function getExecutionStatus(execution: ExecutionResult) {
  return execution.result?.status ?? "unknown";
}

function getOutcomeStyle(execution: ExecutionResult) {
  if (execution.result?.success === true) {
    return "text-emerald-400";
  }

  if (execution.result?.success === false) {
    return "text-yellow-400";
  }

  return "text-neutral-400";
}

export default function HistoryPage() {
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["plan-history"],
    queryFn: getHistory,
  });

  return (
    <main className=" space-y-7 bg-black text-white">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <History size={23} className="text-neutral-400" />

          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        </div>

        <p className="mt-2 text-sm text-neutral-500">
          Review your completed, rejected, and failed workflows.
        </p>
      </div>

      {/* History count */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            {items.length} {items.length === 1 ? "workflow" : "workflows"}
          </p>

          {isFetching && (
            <Loader2 size={14} className="animate-spin text-neutral-500" />
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 py-16">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
          <p className="mt-3 text-sm text-neutral-500">
            Loading your history...
          </p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-neutral-950 p-6 text-center">
          <AlertCircle size={25} className="mx-auto text-red-400" />

          <p className="mt-3 text-sm text-neutral-300">
            {error instanceof Error
              ? error.message
              : "Could not load your history."}
          </p>

          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg border border-neutral-700 px-4 py-2 text-xs text-white transition hover:bg-neutral-800">
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 py-16 text-center">
          <History size={32} className="text-neutral-700" />

          <h2 className="mt-4 text-sm font-medium text-neutral-300">
            No history yet
          </h2>

          <p className="mt-2 max-w-xs text-xs leading-5 text-neutral-600">
            Your completed, rejected, and failed workflows will appear here.
          </p>
        </div>
      )}

      {/* History list */}
      {!isLoading && !isError && items.length > 0 && (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-200">
                    {item.goal}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatDate(item.createdAt)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] capitalize ${
                    statusStyles[item.status]
                  }`}>
                  {item.status}
                </span>
              </div>

              {item.executionResult?.map((execution, index) => (
                <div
                  key={index}
                  className="mt-3 border-t border-neutral-800 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs capitalize text-neutral-400">
                      {execution.action?.replaceAll("_", " ")}
                    </span>

                    <span
                      className={`text-xs ${
                        execution.result?.success
                          ? "text-emerald-400"
                          : "text-yellow-400"
                      }`}>
                      {execution.result?.status?.replaceAll("_", " ")}
                    </span>
                  </div>

                  {execution.result?.message && (
                    <p className="mt-2 text-xs leading-5 text-neutral-500">
                      {execution.result.message}
                    </p>
                  )}

                  {execution.result?.path && (
                    <p className="mt-1 break-all font-mono text-[11px] text-neutral-600">
                      {execution.result.path}
                    </p>
                  )}
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
