"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { auth, AuthError } from "../../../services/auth";

import { useRouter } from "next/navigation";
import GoogleAuth from "../../../component/GoggleAuth";
type LoginValues = {
  email: string;
  password: string;
};

type FieldProps = {
  id: keyof LoginValues;
  label: string;
  type?: string;
  placeholder: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
  error?: string;
  password?: boolean;
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
}: FieldProps) {
  const [show, setShow] = useState(false);

  const inputType = password ? (show ? "text" : "password") : type;

  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-zinc-100">
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
          className={`w-full rounded-xl border bg-transparent px-3.5 py-3 text-[15px] text-zinc-100 outline-none transition placeholder:text-zinc-400 focus:ring-4 ${
            password ? "pr-16" : ""
          } ${
            error
              ? "border-red-500 focus:ring-red-500/20"
              : "border-zinc-700 focus:border-indigo-400 focus:ring-indigo-500/20"
          }`}
          {...registration}
        />

        {password && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
            aria-label={show ? "Hide password" : "Show password"}>
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>

      <p
        id={`${id}-error`}
        role="alert"
        className="mt-1.5 min-h-4 text-xs text-red-500">
        {error}
      </p>
    </div>
  );
}

export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = async (data: LoginValues) => {
    setServerError("");

    try {
      const res = await auth.login({
        email: data.email,
        password: data.password,
      });

      toast.success(res.message || "Login successful!");
      router.push("/dashboard");
    } catch (err) {
      console.log("Login error:", err);

      if (
        err instanceof Error &&
        (err.message === "EMAIL_NOT_VERIFIED" ||
          err.message === "Please verify your email before logging in.")
      ) {
        setUnverifiedEmail(data.email);
        setResending(true);

        try {
          const res = await auth.resendVerification(data.email);
          console.log("Resend response:", res);
          toast.success(res.message);
          setServerError(
            "A new verification link has been sent to your email.",
          );
        } catch (resendErr) {
          const message =
            resendErr instanceof Error
              ? resendErr.message
              : "Unable to resend verification email.";

          setServerError(message);
          toast.error(message);
        } finally {
          setResending(false);
        }

        return;
      }

      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#262626] py-6">
      <div className="mx-auto w-[calc(100%-1rem)] max-w-2xl rounded-[20px] bg-[#080808] p-8 shadow-xl shadow-black/5">
        <h1 className="text-[26px] font-semibold tracking-tight text-zinc-50">
          Welcome back
        </h1>
        <p className="mb-6 mt-1.5 text-sm text-zinc-400">
          Log in to continue to your account.
        </p>
        <GoogleAuth />
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-zinc-400">
          <span className="h-px flex-1 bg-zinc-800" />
          Or continue with email
          <span className="h-px flex-1 bg-zinc-800" />
        </div>
        {serverError && (
          <p role="alert" className="mb-4 text-center text-sm text-red-500">
            {serverError}
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
            placeholder="Enter your password"
            autoComplete="current-password"
            registration={register("password", {
              required: "Password is required.",
            })}
            error={errors.password?.message}
          />

          <div className="-mt-1 mb-5 text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-zinc-400 transition hover:text-white hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-white py-3 text-[15px] font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-white underline">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
