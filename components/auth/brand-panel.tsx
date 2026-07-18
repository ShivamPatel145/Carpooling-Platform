import Link from "next/link";
import { homepageCopy } from "@/homepage.config";
import { CorideMark } from "@/components/shell/coride-logo";

/**
 * The dark brand rail beside the auth form — matches the Coride comp's left panel: logo, a short
 * value line, a "match on your route" preview card, and a verified footer. Ink band, amber glow,
 * dotted texture. Hidden below lg (the form takes the full width on phones).
 */
export function CoBrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between gap-9 overflow-hidden border-r border-[color:var(--line)] bg-[#14171D] p-[clamp(28px,5vw,56px)] text-[#F4F1EA] lg:flex">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(244,241,234,0.07) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
          WebkitMaskImage: "radial-gradient(95% 70% at 20% 18%,#000,transparent 82%)",
          maskImage: "radial-gradient(95% 70% at 20% 18%,#000,transparent 82%)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-[14%] -top-[12%] h-[52%] w-[62%]"
        style={{ background: "radial-gradient(circle,rgba(244,167,38,0.16),transparent 70%)" }}
      />

      <Link href="/" className="relative inline-flex items-center gap-2.5 self-start">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[rgba(244,241,234,0.1)]">
          <CorideMark size={24} />
        </span>
        <span className="font-display text-[22px] font-bold tracking-[-0.02em] text-[#F4F1EA]">
          {homepageCopy.productName}
        </span>
      </Link>

      <div className="relative">
        <h2 className="m-0 mb-3.5 max-w-[14ch] text-balance font-display text-[clamp(26px,3.2vw,38px)] font-bold leading-[1.08] tracking-[-0.02em]">
          The evening commute, shared.
        </h2>
        <p className="m-0 mb-6 max-w-[24em] text-[15px] text-[rgba(244,241,234,0.6)]">
          You&apos;ll only ever see verified people from your own company, on your exact route.
        </p>
        <div className="max-w-[330px] rounded-[16px] border border-[rgba(244,241,234,0.13)] bg-[rgba(244,241,234,0.05)] p-4">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.05em] text-[rgba(244,241,234,0.7)]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#F4A726]" />
              MATCH ON YOUR ROUTE
            </span>
            <span className="font-mono text-[11px] text-[rgba(244,241,234,0.4)]">08:40</span>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-[rgba(244,241,234,0.6)]" />
              <span
                className="my-0.5 w-0.5 flex-1"
                style={{ minHeight: 22, background: "repeating-linear-gradient(rgba(244,241,234,0.3) 0 4px,transparent 4px 8px)" }}
              />
              <span className="h-2.5 w-2.5 rotate-45 bg-[#F4F1EA]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-3.5 text-[13.5px] font-semibold">ISKCON Cross Road</div>
              <div className="text-[13.5px] font-semibold">Infocity, Gandhinagar</div>
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between border-t border-[rgba(244,241,234,0.12)] pt-3">
            <span className="inline-flex items-center whitespace-nowrap rounded-full border border-[rgba(244,167,38,0.34)] bg-[rgba(244,167,38,0.16)] px-2.5 py-1 font-mono text-[11.5px] font-semibold text-[#F4A726]">
              2 seats
            </span>
            <span className="font-mono text-[15px] font-semibold text-[#F4A726]">
              ₹30<span className="text-[10px] text-[rgba(244,241,234,0.5)]">/seat</span>
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-2.5 font-mono text-[12px] text-[rgba(244,241,234,0.55)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#54B784]" />
        Company-verified · scoped to your work domain
      </div>
    </div>
  );
}
