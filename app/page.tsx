import Link from "next/link";
import {
  ArrowRight,
  Search,
  Users,
  MapPin,
  Wallet,
  Leaf,
  ShieldCheck,
  Clock,
  Check,
} from "lucide-react";
import { auth } from "@/auth";
import { PublicHeader } from "@/components/marketing/public-header";
import { CorideMark } from "@/components/shell/coride-logo";
import { coAmberBtn, coGhostBtn, CoAvatar, CoSeatBadge } from "@/components/co/ui";
import { homepageCopy } from "@/homepage.config";

/**
 * Public homepage — the Coride landing, matched to the design comp: an editorial hero with a live
 * "match found" card, popular routes, the problem, how-it-works, the benefits, a trust & safety
 * band, and a closing CTA. Warm palette + LOCKED type system throughout (design-standards). Content
 * here is the product's marketing story (illustrative), not user data.
 */

const ROUTES = [
  { route: "ISKCON → Infocity", days: "Mon–Fri", depart: "08:40", seats: "2 seats", fare: "30" },
  { route: "Bopal → Prahladnagar", days: "Mon–Sat", depart: "09:10", seats: "3 seats", fare: "45" },
  { route: "Thaltej → GIFT City", days: "Mon–Fri", depart: "08:20", seats: "1 seat", fare: "60" },
];

const STEPS = [
  { n: "01", title: "Set your route", desc: "Tell Coride where you start and where you work. Save it once.", Icon: Search },
  { n: "02", title: "Get matched", desc: "See verified colleagues driving your exact way, at your time.", Icon: Users },
  { n: "03", title: "Ride & track", desc: "Book a seat and follow the trip live, right up to the office gate.", Icon: MapPin },
  { n: "04", title: "Split the cost", desc: "Fares settle from your wallet automatically. No cash, no awkwardness.", Icon: Wallet },
];

const BENEFITS = [
  { title: "Cut your commute cost", desc: "Split fuel four ways and keep the change in your pocket every month.", stat: "Save ₹2,800/mo", Icon: Wallet },
  { title: "Lighter on the road", desc: "Fewer cars on SG Highway means less traffic and cleaner air for the city.", stat: "−1.2t CO₂/yr", Icon: Leaf },
  { title: "Verified, always", desc: "Only people from your own company, checked against their work domain.", stat: "100% verified", Icon: ShieldCheck },
  { title: "Time worth having", desc: "Share the drive, share the chat — arrive less drained than driving solo.", stat: "42 min back", Icon: Clock },
];

const SAFETY = [
  { title: "Company-verified identities", desc: "Every account is tied to a real work email or ID." },
  { title: "Scoped to your organisation", desc: "You only ever see riders from your own company." },
  { title: "Live trip tracking", desc: "Share your live location with someone you trust." },
  { title: "Ratings after every ride", desc: "Two-way feedback keeps the community accountable." },
  { title: "In-app chat & support", desc: "No phone numbers shared until you choose to." },
];

const STATS = [
  { v: "1.2M km", l: "shared, not driven solo" },
  { v: "₹4.6 Cr", l: "saved on fuel together" },
  { v: "12,000+", l: "verified commuters" },
];

export default async function HomePage() {
  const session = await auth();
  const isAuthed = Boolean(session?.user);
  const startHref = isAuthed ? "/dashboard" : "/register";

  return (
    <div className="min-h-screen bg-[color:var(--page)] text-[color:var(--ink)]">
      <PublicHeader isAuthed={isAuthed} />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage: "radial-gradient(var(--dot) 1px,transparent 1px)",
              backgroundSize: "26px 26px",
              WebkitMaskImage: "radial-gradient(80% 70% at 62% 32%,#000,transparent 78%)",
              maskImage: "radial-gradient(80% 70% at 62% 32%,#000,transparent 78%)",
            }}
          />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-[clamp(28px,5vw,64px)] px-[clamp(18px,4vw,40px)] py-[clamp(30px,6vh,72px)] lg:grid-cols-2">
            {/* Left */}
            <div className="min-w-0">
              <div className="mb-6 inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-[13px] py-[7px] text-[13px] text-[color:var(--ink-2)]">
                <span className="h-[7px] w-[7px] rounded-full bg-[color:var(--amber)] shadow-[0_0_0_3px_var(--amber-tint)]" />
                Daily-commute carpooling · <span className="font-mono text-[12px]">Ahmedabad → Gandhinagar</span>
              </div>
              <h1 className="m-0 mb-[22px] max-w-[13ch] text-balance font-display text-[clamp(40px,5.8vw,64px)] font-bold leading-[1.02] tracking-[-0.03em]">
                Two of you are already going the same way.
              </h1>
              <p className="m-0 mb-[30px] max-w-[32em] text-[clamp(16px,1.35vw,19px)] text-[color:var(--ink-2)]">
                Coride matches you with verified neighbours and colleagues on your exact route — so the
                daily drive to Infocity costs less, pollutes less, and finally feels like time worth having.
              </p>
              <div className="mb-7 flex flex-wrap gap-3">
                <Link href={startHref} className={`${coAmberBtn} px-[26px] py-[15px] text-[16px]`}>
                  {isAuthed ? "Open the app" : "Get started — it's free"}
                </Link>
                <a href="#co-how" className={`${coGhostBtn} px-6 py-[15px] text-[16px]`}>
                  See how it works
                  <ArrowRight className="h-[17px] w-[17px]" />
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-3.5">
                <div className="flex">
                  {["RP", "KS", "PS", "MI"].map((a, i) => (
                    <span
                      key={a}
                      className="-ml-2.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[color:var(--page)] bg-[color:var(--avatar-bg)] font-display text-[12px] font-semibold text-[color:var(--avatar-fg)] first:ml-0"
                      style={{ marginLeft: i === 0 ? 0 : undefined }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[13px] tracking-wide text-[color:var(--amber)]">
                    ★★★★★ <span className="font-mono tracking-normal text-[color:var(--ink-2)]">4.9</span>
                  </div>
                  <div className="text-[13px] text-[color:var(--ink-3)]">
                    Joined by <span className="font-semibold text-[color:var(--ink)]">12,000+ commuters</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — match card */}
            <div className="relative min-w-0">
              <div className="absolute -bottom-3.5 -right-2 left-[22px] top-[34px] z-0 rounded-[22px] border border-[color:var(--line)] bg-[color:var(--surface-2)]" />
              <div className="relative z-[1] overflow-hidden rounded-[22px] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-[0_26px_64px_-34px_rgba(26,29,36,0.55)]">
                <div className="flex items-center justify-between bg-[#14171D] px-[18px] py-4 text-[#F4F1EA]">
                  <div className="flex items-center gap-2.5">
                    <span className="relative h-2 w-2">
                      <span className="absolute inset-0 rounded-full bg-[color:var(--amber)]" />
                      <span className="co-pulse absolute inset-0 rounded-full bg-[color:var(--amber)]" />
                    </span>
                    <span className="font-mono text-[12px] tracking-[0.05em]">MATCH FOUND · 2 MIN AGO</span>
                  </div>
                  <span className="font-mono text-[11.5px] text-[rgba(244,241,234,0.6)]">TODAY · 08:40</span>
                </div>
                <div className="px-[18px] pb-2 pt-5">
                  <div className="flex gap-3.5">
                    <div className="flex flex-col items-center pt-[5px]">
                      <span className="h-3 w-3 rounded-full border-[2.5px] border-[color:var(--ink-2)]" />
                      <span
                        className="my-[3px] w-0.5 flex-1"
                        style={{ minHeight: 40, background: "repeating-linear-gradient(var(--line-2) 0 5px,transparent 5px 10px)" }}
                      />
                      <span className="h-3 w-3 rotate-45 bg-[color:var(--ink)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-6">
                        <div className="font-display text-[18px] font-semibold tracking-[-0.01em]">ISKCON Cross Road</div>
                        <div className="text-[12.5px] text-[color:var(--ink-3)]">Pickup · 2 min walk</div>
                      </div>
                      <div>
                        <div className="font-display text-[18px] font-semibold tracking-[-0.01em]">Infocity, Gandhinagar</div>
                        <div className="text-[12.5px] text-[color:var(--ink-3)]">Drop · office gate</div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-mono">
                      <div className="text-[19px] font-semibold">08:40</div>
                      <div className="mt-0.5 text-[11px] text-[color:var(--ink-3)]">21.4 km</div>
                    </div>
                  </div>
                </div>
                <div className="mx-3.5 mt-2 flex items-center gap-3 border-t border-[color:var(--line)] px-[18px] py-3.5">
                  <CoAvatar initials="KS" size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-semibold">
                      Krishna Singh <span className="font-normal text-[color:var(--ink-3)]">· driving</span>
                    </div>
                    <div className="font-mono text-[12px] text-[color:var(--ink-3)]">Honda City · ★ 4.9 · verified</div>
                  </div>
                  <CoSeatBadge>2 seats</CoSeatBadge>
                </div>
                <div className="mx-3.5 mb-4 mt-1.5 flex items-center justify-between gap-3 rounded-[14px] bg-[color:var(--surface-2)] px-[18px] py-4">
                  <div>
                    <div className="text-[12px] text-[color:var(--ink-3)]">
                      Your share today · <span className="font-semibold text-[color:var(--ok)]">save ₹90</span>
                    </div>
                    <div className="font-mono text-[16px] font-semibold text-[color:var(--ink-2)]">
                      ₹120 solo → <span className="text-[color:var(--amber-strong)]">₹30</span>
                    </div>
                  </div>
                  <Link href={startHref} className={`${coAmberBtn} px-5 py-2.5 text-[14px]`}>
                    Book seat
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROUTES */}
        <section id="co-routes" className="border-t border-[color:var(--line)] bg-[color:var(--surface-2)]">
          <div className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,40px)] py-[clamp(38px,6vh,64px)]">
            <div className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2.5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[color:var(--amber-strong)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--amber)]" />
                  Live right now
                </div>
                <h2 className="m-0 text-balance font-display text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.02em]">
                  Rides leaving on popular routes today
                </h2>
              </div>
              <Link href={startHref} className={`${coGhostBtn} whitespace-nowrap px-[18px] py-2.5 text-[14px]`}>
                Search your route
              </Link>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {ROUTES.map((r) => (
                <div key={r.route} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-[18px] transition hover:-translate-y-0.5 hover:border-[color:var(--amber-line)]">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-[13px] text-[color:var(--ink-2)]">{r.route}</span>
                    <span className="text-[11.5px] text-[color:var(--ink-3)]">{r.days}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-[22px] font-semibold tracking-[-0.01em]">{r.depart}</div>
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="h-[7px] w-[7px] rounded-full border-2 border-[color:var(--ink-2)]" />
                      <span className="h-0.5 flex-1" style={{ background: "repeating-linear-gradient(90deg,var(--line-2) 0 5px,transparent 5px 10px)" }} />
                      <span className="h-2 w-2 rotate-45 bg-[color:var(--ink)]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[color:var(--line)] pt-3.5">
                    <CoSeatBadge>{r.seats}</CoSeatBadge>
                    <div className="text-right">
                      <span className="font-mono text-[17px] font-semibold text-[color:var(--amber-strong)]">₹{r.fare}</span>
                      <span className="text-[11px] text-[color:var(--ink-3)]">/seat</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-[clamp(20px,4vw,56px)] border-t border-[color:var(--line)] pt-6">
              <div className="max-w-[14em] self-center text-[13.5px] text-[color:var(--ink-3)]">
                Since 2024, Coride commuters have together shared
              </div>
              {STATS.map((s) => (
                <div key={s.l}>
                  <div className="font-display text-[clamp(22px,2.4vw,30px)] font-bold leading-none tracking-[-0.02em]">{s.v}</div>
                  <div className="mt-1 text-[12.5px] text-[color:var(--ink-2)]">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section id="co-why" className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,40px)] py-[clamp(48px,8vh,96px)]">
          <div className="grid items-center gap-[clamp(30px,5vw,72px)] lg:grid-cols-2">
            <div>
              <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">The problem</div>
              <h2 className="m-0 mb-5 text-balance font-display text-[clamp(28px,4vw,44px)] font-bold leading-[1.08] tracking-[-0.02em]">
                Four empty seats, one tired driver — every single morning.
              </h2>
              <p className="m-0 mb-[22px] max-w-[34em] text-[clamp(15px,1.3vw,18px)] text-[color:var(--ink-2)]">
                The average commute car runs 80% empty. Multiply that across one office park and it's
                thousands of near-identical trips down the same road — burning fuel, clogging SG Highway,
                and costing everyone time and money to travel alone, together.
              </p>
              <div className="flex flex-wrap gap-7 border-t border-[color:var(--line)] pt-[22px]">
                <div>
                  <div className="font-display text-[28px] font-bold tracking-[-0.02em]">₹3,200</div>
                  <div className="mt-0.5 max-w-[12em] text-[13px] text-[color:var(--ink-2)]">avg monthly fuel, driving solo</div>
                </div>
                <div>
                  <div className="font-display text-[28px] font-bold tracking-[-0.02em]">42 min</div>
                  <div className="mt-0.5 max-w-[12em] text-[13px] text-[color:var(--ink-2)]">each way, mostly alone in traffic</div>
                </div>
              </div>
            </div>
            <div className="rounded-[20px] border border-[color:var(--line)] bg-[color:var(--surface)] p-7">
              <div className="mb-5 text-[13px] text-[color:var(--ink-3)]">A typical commute car</div>
              <div className="mb-5 grid grid-cols-2 gap-3.5">
                <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[14px] bg-[color:var(--band)] text-[color:var(--on-band)]">
                  <Users className="h-6 w-6" strokeWidth={1.5} />
                  <span className="text-[11.5px] font-semibold">Driver</span>
                </div>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-[color:var(--line-2)] text-[color:var(--ink-3)]">
                    <span className="text-[22px] font-light leading-none">＋</span>
                    <span className="text-[11.5px]">Empty</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-[color:var(--line)] pt-[18px]">
                <span className="text-[13.5px] text-[color:var(--ink-2)]">Seats going to waste</span>
                <span className="font-mono text-[20px] font-semibold">75%</span>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="co-how" className="border-y border-[color:var(--line)] bg-[color:var(--surface-2)]">
          <div className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,40px)] py-[clamp(48px,8vh,92px)]">
            <div className="mb-9 max-w-[38em]">
              <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">How it works</div>
              <h2 className="m-0 text-balance font-display text-[clamp(28px,4vw,44px)] font-bold leading-[1.08] tracking-[-0.02em]">
                From your street to your desk, in four easy moves.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[20px] border border-[color:var(--line)] bg-[color:var(--line)] sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ n, title, desc, Icon }) => (
                <div key={n} className="flex min-h-[200px] flex-col gap-4 bg-[color:var(--surface)] p-[22px] pt-[26px]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-[color:var(--ink)]">
                      <Icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
                    </span>
                    <span className="font-mono text-[13px] text-[color:var(--amber-strong)]">{n}</span>
                  </div>
                  <div>
                    <div className="mb-[7px] font-display text-[19px] font-semibold tracking-[-0.01em]">{title}</div>
                    <div className="text-[14px] text-[color:var(--ink-2)]">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,40px)] py-[clamp(48px,8vh,96px)]">
          <div className="mb-11 max-w-[38em]">
            <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">Why Coride</div>
            <h2 className="m-0 text-balance font-display text-[clamp(28px,4vw,44px)] font-bold leading-[1.08] tracking-[-0.02em]">
              A better way to arrive — for your wallet, the road, and you.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ title, desc, stat, Icon }) => (
              <div key={title} className="flex flex-col gap-3.5 rounded-[18px] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 transition hover:-translate-y-[3px] hover:border-[color:var(--line-2)]">
                <span className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-[color:var(--ink)]">
                  <Icon className="h-[23px] w-[23px]" strokeWidth={1.6} />
                </span>
                <div className="flex-1">
                  <div className="mb-2 font-display text-[18px] font-semibold tracking-[-0.01em]">{title}</div>
                  <div className="text-[14px] text-[color:var(--ink-2)]">{desc}</div>
                </div>
                <div className="font-mono text-[13px] font-semibold text-[color:var(--amber-strong)]">{stat}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST & SAFETY */}
        <section id="co-safety" className="bg-[color:var(--band)]">
          <div className="mx-auto max-w-[1240px] px-[clamp(18px,4vw,40px)] py-[clamp(48px,8vh,96px)]">
            <div className="grid items-start gap-[clamp(30px,5vw,64px)] lg:grid-cols-2">
              <div>
                <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--on-band-2)]">Trust & safety</div>
                <h2 className="m-0 mb-5 text-balance font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.08] tracking-[-0.02em] text-[color:var(--on-band)]">
                  You should know exactly who&apos;s in the car.
                </h2>
                <p className="m-0 mb-7 max-w-[30em] text-[16px] text-[color:var(--on-band-2)]">
                  Every rider and driver is verified against their workplace or ID. Safety isn&apos;t a
                  feature bolted on the side — it&apos;s the reason people trust Coride with their daily commute.
                </p>
                <div className="flex flex-col gap-0.5 overflow-hidden rounded-[16px]" style={{ background: "var(--band-line)" }}>
                  {SAFETY.map((sf) => (
                    <div key={sf.title} className="flex items-center gap-3.5 bg-[color:var(--band)] px-[18px] py-[15px]">
                      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[color:var(--ok-tint)] text-[color:var(--ok)]">
                        <Check className="h-[17px] w-[17px]" strokeWidth={1.8} />
                      </span>
                      <div>
                        <div className="text-[14.5px] font-semibold text-[color:var(--on-band)]">{sf.title}</div>
                        <div className="text-[12.5px] text-[color:var(--on-band-2)]">{sf.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid content-start gap-4 sm:grid-cols-2">
                <Testimonial quote="I've saved ₹3,400 this quarter and actually made two friends on my route." name="Priya Sharma" route="Bopal → Prahladnagar" initials="PS" />
                <Testimonial quote="Publishing my empty seats takes ten seconds. It basically covers my fuel." name="Krishna Singh" route="ISKCON → Infocity" initials="KS" />
                <div className="rounded-[18px] border border-[color:var(--amber-line)] bg-[color:var(--surface)] p-6 sm:col-span-2">
                  <div className="tracking-[2px] text-[color:var(--amber-strong)]">★★★★★</div>
                  <p className="my-4 font-display text-[clamp(18px,1.7vw,23px)] font-semibold leading-[1.35] tracking-[-0.01em] text-[color:var(--ink)]">
                    &ldquo;Live tracking and verified profiles mean my parents finally stopped worrying about the late rides home.&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <CoAvatar initials="MI" size={40} />
                    <div>
                      <div className="text-[14px] font-semibold text-[color:var(--ink)]">Meera Iyer</div>
                      <div className="font-mono text-[12px] text-[color:var(--ink-3)]">Thaltej → GIFT City</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[color:var(--page)]">
          <div className="mx-auto max-w-[1040px] px-[clamp(18px,4vw,40px)] py-[clamp(52px,9vh,104px)]">
            <div className="relative overflow-hidden rounded-[26px] bg-[color:var(--band)] px-[clamp(24px,5vw,56px)] py-[clamp(38px,6vw,64px)] text-center">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: "radial-gradient(rgba(244,241,234,0.09) 1px,transparent 1px)",
                  backgroundSize: "24px 24px",
                  WebkitMaskImage: "radial-gradient(70% 80% at 50% 0%,#000,transparent 75%)",
                  maskImage: "radial-gradient(70% 80% at 50% 0%,#000,transparent 75%)",
                }}
              />
              <div className="relative">
                <h2 className="m-0 mb-[18px] text-balance font-display text-[clamp(30px,4.6vw,52px)] font-bold leading-[1.05] tracking-[-0.03em] text-[color:var(--on-band)]">
                  Your first shared ride is one search away.
                </h2>
                <p className="mx-auto m-0 mb-8 max-w-[30em] text-[clamp(16px,1.4vw,19px)] text-[color:var(--on-band-2)]">
                  Join thousands of commuters already splitting the drive to work. Free to join, no card required.
                </p>
                <div className="flex flex-wrap justify-center gap-3.5">
                  <Link href={startHref} className={`${coAmberBtn} px-8 py-4 text-[16px]`}>
                    {isAuthed ? "Open the app" : "Get started free"}
                  </Link>
                  <Link
                    href={isAuthed ? "/dashboard" : "/login"}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-[color:var(--band-line)] px-7 py-4 text-[16px] font-semibold text-[color:var(--on-band)] transition hover:border-[color:var(--on-band)]"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[color:var(--line)] bg-[color:var(--page)] text-[color:var(--ink-3)]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-6 px-[clamp(18px,4vw,40px)] py-9">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[color:var(--band)]">
              <CorideMark size={21} />
            </span>
            <div>
              <div className="font-display text-[17px] font-bold text-[color:var(--ink)]">{homepageCopy.productName}</div>
              <div className="font-mono text-[12px]">Ride together. Arrive better.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-[22px] text-[13.5px]">
            <a href="#co-how" className="text-[color:var(--ink-2)] hover:text-[color:var(--ink)]">How it works</a>
            <a href="#co-routes" className="text-[color:var(--ink-2)] hover:text-[color:var(--ink)]">Routes</a>
            <a href="#co-safety" className="text-[color:var(--ink-2)] hover:text-[color:var(--ink)]">Trust &amp; safety</a>
            <Link href="/login" className="text-[color:var(--ink-2)] hover:text-[color:var(--ink)]">Sign in</Link>
          </div>
          <div className="font-mono text-[12.5px]">© {new Date().getFullYear()} {homepageCopy.productName} Mobility</div>
        </div>
      </footer>
    </div>
  );
}

function Testimonial({
  quote,
  name,
  route,
  initials,
}: {
  quote: string;
  name: string;
  route: string;
  initials: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] bg-[color:var(--band-card)] p-6">
      <div className="tracking-[2px] text-[color:var(--amber)]">★★★★★</div>
      <p className="m-0 flex-1 font-display text-[clamp(16px,1.4vw,18px)] font-medium leading-[1.42] tracking-[-0.01em] text-[color:var(--on-band)]">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <CoAvatar initials={initials} size={40} />
        <div>
          <div className="text-[14px] font-semibold text-[color:var(--on-band)]">{name}</div>
          <div className="font-mono text-[12px] text-[color:var(--on-band-2)]">{route}</div>
        </div>
      </div>
    </div>
  );
}
