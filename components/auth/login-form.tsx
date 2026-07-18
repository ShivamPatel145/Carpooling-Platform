"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { coAmberBtn } from "@/components/co/ui";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type Values = z.infer<typeof schema>;

const coInput =
  "w-full rounded-[10px] border border-[color:var(--line-2)] bg-[color:var(--surface-2)] px-3.5 py-3 text-[15px] text-[color:var(--ink)] outline-none transition-colors placeholder:text-[color:var(--ink-3)] focus:border-[color:var(--amber-strong)]";
const coLabel = "mb-1.5 block text-[13px] text-[color:var(--ink-2)]";

/** Role is decided server-side from the account (looked up by email), so there's no role picker here. */
function homeFor(role: string | undefined): string {
  if (role === "super_admin") return "/platform";
  if (role === "company_admin") return "/admin";
  return "/app";
}

export function LoginForm({ googleEnabled, googleSlot }: { googleEnabled: boolean; googleSlot?: React.ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl");
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  async function onSubmit(values: Values) {
    setPending(true);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (res?.error) {
      setPending(false);
      toast({ variant: "destructive", title: "Sign in failed", description: "Incorrect email or password." });
      return;
    }

    // The account's role (keyed by email) is the source of truth — route to its console.
    const session = await getSession();
    setPending(false);
    router.push(callbackUrl || homeFor(session?.user?.role));
    router.refresh();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="m-0 mb-1 font-display text-[26px] font-bold tracking-[-0.02em] text-[color:var(--ink)]">
            Welcome back
          </h1>
          <p className="m-0 text-[14px] text-[color:var(--ink-2)]">Sign in to find and offer rides.</p>
        </div>
        <ThemeToggle />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <label className="mb-1 block">
          <span className={coLabel}>Work email or mobile</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="raj.patel@aarna.co"
            className={cn(coInput, errors.email && "border-[color:var(--destructive)]")}
            {...form.register("email")}
          />
        </label>
        {errors.email ? (
          <p className="mb-3 text-[12.5px] text-[color:var(--destructive)]">{errors.email.message}</p>
        ) : (
          <p className="mb-3 text-[12.5px] text-[color:var(--ink-3)]">
            Use your work email — Coride links you to your company automatically.
          </p>
        )}

        <label className="mb-1 block">
          <span className={coLabel}>Password</span>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
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
        </label>
        {errors.password && (
          <p className="mb-1 text-[12.5px] text-[color:var(--destructive)]">{errors.password.message}</p>
        )}

        <div className="mb-5 mt-3.5 flex items-center justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[13.5px] text-[color:var(--ink-2)]">
            <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[color:var(--amber-strong)]" />
            Remember me
          </label>
        </div>

        <button type="submit" disabled={pending} className={`${coAmberBtn} w-full py-3.5 text-[15.5px]`}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
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
        Accounts are created by your company. Ask your admin if you don&apos;t have access yet.
      </p>
    </div>
  );
}
