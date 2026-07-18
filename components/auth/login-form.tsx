"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, User2, Building2 } from "lucide-react";
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

/** The two audiences from the comp — pre-fills the matching demo account for a fast judge login. */
const AUDIENCES = [
  { key: "employee", label: "Employee", desc: "Find & offer rides", email: "employee@demo.dev", Icon: User2 },
  { key: "company_admin", label: "Company admin", desc: "Manage your org", email: "admin@demo.dev", Icon: Building2 },
] as const;

function homeFor(role: string | undefined): string {
  if (role === "super_admin") return "/platform";
  if (role === "company_admin") return "/admin";
  return "/app";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl");
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const [audience, setAudience] = React.useState<(typeof AUDIENCES)[number]["key"]>("employee");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  function pickAudience(a: (typeof AUDIENCES)[number]) {
    setAudience(a.key);
    // Only pre-fill when the field is empty or still holds another demo email — never clobber typing.
    const current = form.getValues("email");
    if (!current || AUDIENCES.some((x) => x.email === current)) {
      form.setValue("email", a.email, { shouldValidate: false });
    }
  }

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

    // Route to the real role home (server is the source of truth for role, not the switcher).
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

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-[12px] bg-[color:var(--surface-2)] p-1">
        <span className="flex-1 rounded-[9px] bg-[color:var(--surface)] py-2.5 text-center text-[14px] font-semibold text-[color:var(--ink)] shadow-sm">
          Sign in
        </span>
        <Link
          href="/register"
          className="flex-1 rounded-[9px] py-2.5 text-center text-[14px] font-semibold text-[color:var(--ink-3)] transition-colors hover:text-[color:var(--ink)]"
        >
          Create account
        </Link>
      </div>

      {/* Sign in as — the comp's audience switcher (pre-fills the demo account) */}
      <div className="mb-5">
        <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.06em] text-[color:var(--ink-3)]">
          Sign in as
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          {AUDIENCES.map((a) => {
            const active = audience === a.key;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => pickAudience(a)}
                aria-pressed={active}
                className={cn(
                  "flex items-start gap-2.5 rounded-[12px] border p-3 text-left transition",
                  active
                    ? "border-[color:var(--amber-strong)] bg-[color:var(--amber-tint)]"
                    : "border-[color:var(--line-2)] bg-[color:var(--surface-2)] hover:border-[color:var(--ink-3)]",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]",
                    active ? "bg-[color:var(--btn-amber-bg)] text-white" : "bg-[color:var(--surface)] text-[color:var(--ink-2)]",
                  )}
                >
                  <a.Icon className="h-4 w-4" strokeWidth={1.7} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-[color:var(--ink)]">{a.label}</span>
                  <span className="block text-[12px] text-[color:var(--ink-3)]">{a.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
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
          <Link href="/register" className="text-[13.5px] font-semibold text-[color:var(--amber-strong)] hover:underline">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={pending} className={`${coAmberBtn} w-full py-3.5 text-[15.5px]`}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
      </form>

      <p className="mt-[22px] text-center text-[13.5px] text-[color:var(--ink-3)]">
        New to Coride?{" "}
        <Link href="/register" className="font-semibold text-[color:var(--amber-strong)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
