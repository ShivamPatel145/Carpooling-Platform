"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { CheckCircle2, Loader2, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { acceptInviteSchema, type AcceptInviteValues } from "@/db/schema/invitation";

interface AcceptInviteFormProps {
  token: string;
  email: string;
  role: string;
  orgName: string;
}

/**
 * Client form for accepting a tokenized invitation.
 * Submits to POST /api/invitation/accept, then auto-signs-in the user.
 */
export function AcceptInviteForm({ token, email, role, orgName }: AcceptInviteFormProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AcceptInviteValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      token,
      name: "",
      password: "",
      phone: "",
    },
  });

  async function onSubmit(values: AcceptInviteValues) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invitation/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: { message: string } };
        setError(data.error?.message ?? "Failed to accept invitation.");
        return;
      }

      setDone(true);

      // Auto sign-in after successful account creation
      await signIn("credentials", {
        email,
        password: values.password,
        callbackUrl: "/",
        redirect: true,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h2 className="text-lg font-semibold">Account Created!</h2>
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Invite context */}
      <div className="space-y-2 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;re Invited!</h1>
        <p className="text-sm text-muted-foreground">
          Set up your account to join <strong>{orgName}</strong>
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="outline">
            <Mail className="mr-1.5 h-3 w-3" />
            {email}
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {role === "company_admin" ? "Company Admin" : "Employee"}
          </Badge>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            control={form.control}
            name="name"
            label="Your Full Name"
            placeholder="Jane Smith"
          />
          <TextField
            control={form.control}
            name="phone"
            label="Phone (optional)"
            placeholder="+91 98765 43210"
          />
          <TextField
            control={form.control}
            name="password"
            label="Create Password"
            type="password"
            placeholder="At least 8 characters"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading} id="accept-invite-submit">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Creating account…" : "Accept Invitation & Sign In"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
