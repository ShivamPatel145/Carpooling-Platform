import { Brand } from "@/components/shell/brand";
import { CoBrandPanel } from "@/components/auth/brand-panel";

/**
 * Split auth shell (Coride comp): a dark brand rail on the left (lg+), the form on the right. On
 * phones the rail is hidden and a compact brand sits above the form. This is the one place a
 * centred column is correct — it's a form, not a landing page.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      <CoBrandPanel />
      <div className="flex items-center justify-center bg-[color:var(--page)] px-[clamp(24px,5vw,56px)] py-10 text-[color:var(--ink)]">
        <div className="w-full max-w-[414px]">
          <div className="mb-8 lg:hidden">
            <Brand href="/" size="lg" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
