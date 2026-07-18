"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { coAmberBtn } from "@/components/co/ui";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api, FetchError } from "@/lib/fetcher";

const schema = z
  .object({
    name: z.string().min(1, "Name is required").max(120),
    phone: z.string().max(20).optional().or(z.literal("")),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
type Values = z.infer<typeof schema>;

const coInput =
  "w-full rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface-2)] px-3.5 py-3 text-[15px] text-[color:var(--ink)] outline-none transition-colors placeholder:text-[color:var(--ink-3)] focus:border-[color:var(--amber-strong)]";
const coLabel = "mb-1.5 block text-[13px] text-[color:var(--ink-2)]";

export function RegisterForm({ googleEnabled, googleSlot }: { googleEnabled: boolean; googleSlot?: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", password: "", confirm: "" },
  });
  const { errors } = form.formState;

  async function onSubmit(values: Values) {
    setPending(true);
    try {
      await api.post("/api/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
      });
      // Auto sign-in after a successful registration.
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        toast({ title: "Account created", description: "Please sign in." });
        router.push("/login");
        return;
      }
      // Self-registration always creates an employee → the app home.
      router.push("/app");
      router.refresh();
    } catch (err) {
      const message = err instanceof FetchError ? err.message : "Something went wrong.";
      toast({ variant: "destructive", title: "Couldn't create account", description: message });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="m-0 mb-1 font-display text-[26px] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
            Create an account
          </h1>
          <p className="m-0 text-[14px] text-[color:var(--ink-2)]">Your first shared ride is one search away.</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-[12px] bg-[color:var(--surface-2)] p-1">
        <Link
          href="/login"
          className="flex-1 rounded-[9px] py-2.5 text-center text-[14px] font-semibold text-[color:var(--ink-3)] transition-colors hover:text-[color:var(--ink)]"
        >
          Sign in
        </Link>
        <span className="flex-1 rounded-[9px] bg-[color:var(--surface)] py-2.5 text-center text-[14px] font-semibold text-[color:var(--ink)] shadow-sm">
          Create account
        </span>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="block">
            <span className={coLabel}>Full name</span>
            <input
              autoComplete="name"
              placeholder="Raj Patel"
              className={cn(coInput, errors.name && "border-[color:var(--destructive)]")}
              {...form.register("name")}
            />
            {errors.name && <p className="mt-1 text-[12.5px] text-[color:var(--destructive)]">{errors.name.message}</p>}
          </label>
          <label className="block">
            <span className={coLabel}>Phone</span>
            <input
              autoComplete="tel"
              placeholder="+91 98765 43210"
              className={cn(coInput, errors.phone && "border-[color:var(--destructive)]")}
              {...form.register("phone")}
            />
            {errors.phone && <p className="mt-1 text-[12.5px] text-[color:var(--destructive)]">{errors.phone.message}</p>}
          </label>
        </div>

        <label className="mt-3.5 block">
          <span className={coLabel}>Work email or mobile</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="raj.patel@aarna.co"
            className={cn(coInput, errors.email && "border-[color:var(--destructive)]")}
            {...form.register("email")}
          />
          {errors.email ? (
            <p className="mt-1 text-[12.5px] text-[color:var(--destructive)]">{errors.email.message}</p>
          ) : (
            <p className="mt-1 text-[12.5px] text-[color:var(--ink-3)]">
              Use your work email — Coride links you to your company automatically.
            </p>
          )}
        </label>

        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
          <label className="block">
            <span className={coLabel}>Password</span>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className={cn(coInput, "pr-11", errors.password && "border-[color:var(--destructive)]")}
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center text-[color:var(--ink-3)] transition-colors hover:text-[color:var(--ink)]"
              >
                {showPw ? <Eye className="h-[17px] w-[17px]" strokeWidth={1.5} /> : <EyeOff className="h-[17px] w-[17px]" strokeWidth={1.5} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-[12.5px] text-[color:var(--destructive)]">{errors.password.message}</p>}
          </label>
          <label className="block">
            <span className={coLabel}>Confirm password</span>
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className={cn(coInput, errors.confirm && "border-[color:var(--destructive)]")}
              {...form.register("confirm")}
            />
            {errors.confirm && <p className="mt-1 text-[12.5px] text-[color:var(--destructive)]">{errors.confirm.message}</p>}
          </label>
        </div>

        <p className="mt-4 text-[12.5px] leading-relaxed text-[color:var(--ink-3)]">
          By creating an account you agree to Coride&apos;s{" "}
          <Link href="/" className="font-semibold text-[color:var(--amber-strong)] hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/" className="font-semibold text-[color:var(--amber-strong)] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <button type="submit" disabled={pending} className={`${coAmberBtn} mt-4 w-full py-3.5 text-[15.5px]`}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[color:var(--line)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[color:var(--page)] px-2 text-[color:var(--ink-3)]">or</span>
            </div>
          </div>
          {googleSlot}
        </>
      )}

      <p className="mt-[22px] text-center text-[13.5px] text-[color:var(--ink-3)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[color:var(--amber-strong)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
