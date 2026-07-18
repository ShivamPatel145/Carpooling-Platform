import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { FormSkeleton } from "@/components/states/loading-state";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<FormSkeleton fields={2} />}>
      <LoginForm />
    </Suspense>
  );
}
