"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, ChevronDown, Zap } from "lucide-react";
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

/** Seeded demo accounts (see db/seed.ts) — one per role for a one-tap sign-in on the demo build. */
const DEMO_PASSWORD = "Password123!";
const DEMO_ACCOUNTS: Array<{ label: string; email: string; role: string }> = [
  { label: "Super admin", email: "superadmin@demo.dev", role: "Platform operator" },
  { label: "Company admin", email: "admin@demo.dev", role: "Acme org (auto-approve)" },
  { label: "Employee · driver", email: "employee@demo.dev", role: "Acme · offers rides" },
  { label: "Employee · passenger", email: "rider@demo.dev", role: "Acme · finds rides" },
];

/** Role is decided server-side from the account (looked up by email), so there's no role picker here. */
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
  const [demoOpen, setDemoOpen] = React.useState(false);
  const [demoEmail, setDemoEmail] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  async function authenticate(email: string, password: string) {
    const res = await signIn("credentials", { email, password, redirect: false });

    if (res?.error) {
      toast({ variant: "destructive", title: "Sign in failed", description: "Incorrect email or password." });
      return false;
    }

    // The account's role (keyed by email) is the source of truth — route to its console.
    const session = await getSession();
    router.push(callbackUrl || homeFor(session?.user?.role));
    router.refresh();
    return true;
  }

  async function onSubmit(values: Values) {
    if (pending) return;
    setPending(true);
    const ok = await authenticate(values.email, values.password);
    if (!ok) setPending(false);
  }

  async function signInAsDemo(email: string) {
    if (pending) return;
    setPending(true);
    setDemoEmail(email);
    form.setValue("email", email);
    form.setValue("password", DEMO_PASSWORD);
    const ok = await authenticate(email, DEMO_PASSWORD);
    if (!ok) {
      setPending(false);
      setDemoEmail(null);
    }
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

      {/* method="post" so the browser's native fallback (Enter pressed before hydration, or JS
          disabled) never serialises email/password into the URL as a GET query string; the real
          submit is always the JS handler below, which preventDefaults and calls signIn(). */}
      <form method="post" onSubmit={(e) => { e.preventDefault(); void form.handleSubmit(onSubmit)(e); }} noValidate>
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
          {pending && !demoEmail && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
      </form>

      {/* Demo credentials — one-tap sign-in for every seeded role (demo build only). */}
      <div className="mt-5 rounded-[12px] border border-[color:var(--line-2)] bg-[color:var(--surface-2)]">
        <button
          type="button"
          onClick={() => setDemoOpen((o) => !o)}
          aria-expanded={demoOpen}
          className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-[13.5px] font-semibold text-[color:var(--ink)]">
            <Zap className="h-[15px] w-[15px] text-[color:var(--amber-strong)]" strokeWidth={2} />
            Demo credentials
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[color:var(--ink-3)] transition-transform",
              demoOpen && "rotate-180",
            )}
            strokeWidth={1.75}
          />
        </button>

        {demoOpen && (
          <div className="border-t border-[color:var(--line-2)] p-2">
            <p className="px-1.5 pb-2 pt-1 text-[12px] text-[color:var(--ink-3)]">
              Tap an account to sign in instantly. Password:{" "}
              <span className="font-mono text-[color:var(--ink-2)]">{DEMO_PASSWORD}</span>
            </p>
            <div className="grid gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={pending}
                  onClick={() => void signInAsDemo(acc.email)}
                  className="flex items-center justify-between gap-3 rounded-[9px] border border-[color:var(--line-2)] bg-[color:var(--surface)] px-3 py-2.5 text-left transition-colors hover:border-[color:var(--ink)] disabled:pointer-events-none disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-[color:var(--ink)]">
                      {acc.label}
                    </span>
                    <span className="block truncate font-mono text-[11.5px] text-[color:var(--ink-3)]">
                      {acc.email} · {acc.role}
                    </span>
                  </span>
                  {pending && demoEmail === acc.email ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[color:var(--ink-3)]" />
                  ) : (
                    <span className="shrink-0 font-mono text-[11.5px] font-semibold text-[color:var(--amber-strong)]">
                      Sign in →
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-[22px] text-center text-[13.5px] text-[color:var(--ink-3)]">
        Accounts are created by your company. Ask your admin if you don&apos;t have access yet.
      </p>
    </div>
  );
}
