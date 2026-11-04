import Link from "next/link";
import Image from "next/image";
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
import { GridBackgroundDemo } from "../component/GridBackgroundDemo";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#demo", label: "Demo" },
];

const features = [
  {
    icon: Bot,
    title: "AI-powered planning",
    description:
      "Turn natural language instructions into structured desktop workflows using Muse AI.",
  },
  {
    icon: ShieldCheck,
    title: "Human approval",
    description:
      "Review generated plans and approve actions before your desktop agent executes them.",
  },
  {
    icon: History,
    title: "Execution history",
    description:
      "Keep track of completed tasks, rejected plans, failed operations, and execution results.",
  },
  {
    icon: Zap,
    title: "Local desktop agent",
    description:
      "Connect your computer and execute supported operations directly on your desktop.",
  },
];

const steps = [
  {
    number: "01",
    icon: Sparkles,
    title: "Describe your task",
    description:
      "Tell Visual Workflow what you want to accomplish using everyday language.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Review and approve",
    description:
      "Muse AI generates a structured plan. Review it and decide whether to approve it.",
  },
  {
    number: "03",
    icon: Monitor,
    title: "Execute locally",
    description:
      "Your connected desktop agent performs the approved actions and reports the results.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/V Monogram Workflow Loop (2).png"
              alt="Visual Workflow"
              width={40}
              height={40}
              priority
              className="h-9 w-9 object-contain"
            />
            <span className="text-sm font-bold tracking-tight">
              Visual Workflow
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden px-3 py-2 text-sm text-neutral-300 transition hover:text-white sm:block">
              Log in
            </Link>

            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200">
              Get started
              <ArrowRight size={15} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative px-5 pb-24 pt-24 sm:px-6 md:pb-32 md:pt-32">
        <GridBackgroundDemo />

        {/* Dashboard Preview */}
        <div className="relative mx-auto mt-20 max-w-5xl">
          <div className="absolute -inset-5 -z-10 rounded-3xl bg-blue-500/10 blur-3xl" />

          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            <div className="flex h-12 items-center justify-between border-b border-neutral-800 px-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
              </div>

              <span className="text-xs text-neutral-500">
                Visual Workflow / Dashboard
              </span>

              <Command size={15} className="text-neutral-500" />
            </div>

            <div className="grid min-h-[350px] md:grid-cols-[190px_1fr]">
              <aside className="hidden border-r border-neutral-800 p-5 md:block">
                <div className="mb-8 flex items-center gap-2 text-xs font-semibold">
                  <Workflow size={16} />
                  Workspace
                </div>

                <div className="space-y-4 text-xs text-neutral-500">
                  <p className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-black">
                    <Monitor size={15} />
                    Dashboard
                  </p>

                  <p className="flex items-center gap-3 px-3">
                    <History size={15} />
                    History
                  </p>
                </div>
              </aside>

              <div className="p-5 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">Your workspace</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      What would you like your agent to do?
                    </p>
                  </div>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-400">
                    Agent connected
                  </span>
                </div>

                <div className="mt-8 rounded-xl border border-neutral-800 bg-black p-5">
                  <p className="text-xs text-neutral-500">Your instruction</p>

                  <p className="mt-3 text-sm text-neutral-200">
                    Create a folder called Screenshots on my desktop.
                  </p>

                  <div className="mt-5 flex justify-end">
                    <span className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black">
                      Generate plan
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/4 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles size={16} className="text-blue-400" />
                    AI execution plan
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900">
                      <FolderPlus size={17} className="text-blue-400" />
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-medium">Create folder</p>
                      <p className="mt-1 text-[10px] text-neutral-500">
                        Desktop / Screenshots
                      </p>
                    </div>

                    <CheckCircle2 size={17} className="text-emerald-400" />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-neutral-800 pt-4">
                    <span className="text-[10px] text-neutral-500">
                      Awaiting your approval
                    </span>

                    <span className="rounded-lg bg-white px-4 py-2 text-[10px] font-semibold text-black">
                      Approve plan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-neutral-600">
            Visual representation of the product interface
          </p>
        </div>
      </section>

      {/* Product Demo */}
      <section
        id="demo"
        className="scroll-mt-20 border-t border-white/10 px-5 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              Product demonstration
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              See Visual Workflow in action.
            </h2>

            <p className="mt-4 text-sm leading-7 text-neutral-400">
              Watch how an instruction becomes an AI-generated plan, gets
              approved, and is executed by your desktop agent.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            <video
              controls
              playsInline
              preload="metadata"
              poster="/videos/demo-poster.png"
              className="aspect-video w-full bg-black object-contain">
              <source src="/videos/demo.mp4" type="video/mp4" />
              Your browser does not support video playback.
            </video>
          </div>

          <p className="mt-4 text-center text-xs text-neutral-600">
            Visual Workflow — Product demonstration
          </p>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-20 border-t border-white/10 px-5 py-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              Features
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Intelligence with control.
            </h2>

            <p className="mt-4 text-sm leading-7 text-neutral-400">
              AI planning, human approval, and desktop execution working
              together in one workflow.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 transition hover:border-neutral-700">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900">
                    <Icon size={20} className="text-blue-400" />
                  </div>

                  <h3 className="mt-6 text-sm font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-neutral-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-white/10 bg-neutral-950/50 px-5 py-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              How it works
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              From instruction to execution.
            </h2>

            <p className="mt-4 text-sm leading-7 text-neutral-400">
              Three steps to make desktop automation simpler.
            </p>
          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.number}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-600">
                      {step.number}
                    </span>

                    <Icon size={22} className="text-blue-400" />
                  </div>

                  <div className="mt-6 h-px bg-neutral-800" />

                  <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>

                  <p className="mt-3 text-sm leading-7 text-neutral-500">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-24 sm:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 px-6 py-16 text-center md:px-16">
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px]" />

          <div className="relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900">
              <MousePointer2 size={22} className="text-blue-400" />
            </div>

            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              Make your desktop work smarter.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-400">
              Start creating AI-powered workflows. You describe the task, Muse
              AI plans it, and you decide what gets executed.
            </p>

            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200">
              Get started
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-neutral-500 sm:flex-row">
          <Link href="/" className="font-semibold text-neutral-300">
            Visual Workflow
          </Link>

          <p>AI-powered desktop automation.</p>

          <p>© {new Date().getFullYear()} Visual Workflow</p>
        </div>
      </footer>
    </main>
  );
}
