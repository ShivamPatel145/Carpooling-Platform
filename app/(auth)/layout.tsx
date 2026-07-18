import Link from "next/link";
import { Brand } from "@/components/shell/brand";

/** Centered, single-column auth layout — the ONE place a centered column is correct (it's a form,
 * not a landing page, so design-standards §1's "everything centered" ban doesn't apply). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center px-6">
        <Brand href="/" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <footer className="px-6 py-4 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
