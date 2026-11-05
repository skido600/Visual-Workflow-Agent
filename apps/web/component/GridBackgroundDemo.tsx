import { cn } from "../lib/utils";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Command,
  FolderPlus,
  History,
  Monitor,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
  Play,
} from "lucide-react";
export function GridBackgroundDemo() {
  return (
    <div className="relative flex h-200 w-full items-center justify-center bg-white dark:bg-black">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
      <p className="relative z-20 bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text py-8 text-4xl font-bold text-transparent sm:text-7xl">
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-neutral-900/80 px-4 py-2 text-xs text-neutral-300">
            <Sparkles size={14} className="text-blue-400" />
            Powered by Muse AI
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">muse-wonder-1.0</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-6xl md:text-7xl">
            Your desktop.
            <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-neutral-400 md:text-lg">
            Turn everyday instructions into desktop workflows. Let AI plan your
            tasks, review every action, and approve your local agent to execute
            them.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200">
              Get started
              <ArrowRight size={17} />
            </Link>

            <a
              href="#demo"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-neutral-900 px-7 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800">
              <Play size={16} />
              Watch demo
            </a>
          </div>

          <p className="mt-5 text-xs text-neutral-600">
            AI planning. Human approval. Local execution.
          </p>
        </div>
      </p>
    </div>
  );
}
