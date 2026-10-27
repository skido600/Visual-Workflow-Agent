"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { auth } from "../../../services/auth";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import GoogleAuth from "../../../component/GoggleAuth";

const strengthScore = (pw: string) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s++;
  return s;
};

type SignupValues = {
  username: string;
  email: string;
  password: string;
};

const strengthColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-emerald-500",
];
const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

type FieldProps = {
  id: keyof SignupValues;
  label: string;
  type?: string;
  placeholder: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
  error?: string;
  password?: boolean;
  children?: React.ReactNode;
};

function Field({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  registration,
  error,
  password,
  children,
}: FieldProps) {
  const [show, setShow] = useState(false);
  const inputType = password ? (show ? "text" : "password") : type;

  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-transparent px-3.5 py-3 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-4 dark:text-zinc-100 ${
            password ? "pr-16" : ""
          } ${
            error
              ? "border-red-500 focus:ring-red-500/20"
              : "border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-zinc-700 dark:focus:border-indigo-400"
          }`}
          {...registration}
        />
        {password && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            aria-label={show ? `Hide ${label}` : `Show ${label}`}>
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {children}
      <p
        id={`${id}-error`}
        role="alert"
        className="mt-1.5 min-h-4 text-xs text-red-500">
        {error}
      </p>
    </div>
  );
}

export default function SignupPage() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,

    formState,
  } = useForm<SignupValues>({
    mode: "onTouched",
    defaultValues: { username: "", email: "", password: "" },
  });

  const { errors, isSubmitting } = formState;

  const password = watch("password");
  const score = password ? Math.max(1, strengthScore(password)) : 0;

  const passwordReg = register("password", {
    required: "Password is required.",
    minLength: { value: 8, message: "Use at least 8 characters." },
    validate: (v: any) =>
      strengthScore(v) >= 2 || "Add uppercase letters, numbers or symbols.",
  });

  const onSubmit = async (data: SignupValues) => {
    setServerError("");

    try {
      const res = await auth.register({
        username: data.username,
        email: data.email,
        password: data.password,
      });

      toast.success(res.message);
      setDone(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#262626] py-6 ">
      <div className="mx-auto w-[calc(100%-1rem)] max-w-2xl rounded-[20px]  p-8 shadow-xl shadow-black/5 bg-[#080808]">
        {done ? (
          <div className="py-3 text-center">
            <div className="mx-auto mb-4 grid h-13 w-13 place-items-center rounded-full bg-emerald-500 text-2xl text-white">
              ✓
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              You&apos;re all set
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Your account has been created.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Continue to log in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <h1 className="text-[26px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Create your account
            </h1>
            <p className="mb-6 mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              It only takes a minute to get started.
            </p>
            <GoogleAuth />
            <div className="my-5.5 flex items-center gap-3 text-xs uppercase tracking-widest text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              Or continue with
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>
            {serverError && (
              <p
                role="alert"
                className="mb-3 text-sm text-center mt-5 text-red-500">
                {serverError}
              </p>
            )}
            <Field
              id="username"
              label="Username"
              placeholder="johndoe"
              autoComplete="username"
              registration={register("username", {
                required: "Username is required.",

                setValueAs: (v: string) => v.trim(),
              })}
              error={errors.username?.message}
            />
            <Field
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              registration={register("email", {
                required: "Email is required.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                  message: "Enter a valid email address.",
                },
                setValueAs: (v: string) => v.trim(),
              })}
              error={errors.email?.message}
            />
            <Field
              id="password"
              label="Password"
              password
              placeholder="At least 8 characters"
              autoComplete="new-password"
              registration={passwordReg}
              error={errors.password?.message}>
              <div className="mt-2 flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded transition-colors ${
                      i < score
                        ? strengthColors[score - 1]
                        : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-1.5 min-h-4 text-xs text-zinc-500 dark:text-zinc-400">
                {score ? strengthLabels[score - 1] : ""}
              </p>
            </Field>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xl bg-white py-3.25 text-[15px] font-semibold text-black transition  disabled:cursor-not-allowed disabled:opacity-60 ">
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
            <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium underline">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
