import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";
import { FormSkeleton } from "@/components/states/loading-state";
import { features } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<FormSkeleton fields={2} />}>
      <LoginForm googleEnabled={features.googleAuth} googleSlot={<GoogleButton />} />
    </Suspense>
  );
}
