import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/auth/google-button";
import { features } from "@/lib/env";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return <RegisterForm googleEnabled={features.googleAuth} googleSlot={<GoogleButton />} />;
}
