import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Free SaaS Subscription Cost Calculator | Annual Subscription Overhead",
      },
      {
        name: "description",
        content:
          "Use MONITOR to calculate monthly subscription costs, annual SaaS spend, and hidden recurring subscription overhead. Private, browser-only, and free.",
      },
      {
        property: "og:title",
        content:
          "Free SaaS Subscription Cost Calculator | Annual Subscription Overhead",
      },
      {
        property: "og:description",
        content:
          "Calculate annual SaaS spend, monthly subscription burn, and hidden recurring expenses with a private browser-based tracker.",
      },
      {
        name: "twitter:title",
        content:
          "Free SaaS Subscription Cost Calculator | Annual Subscription Overhead",
      },
      {
        name: "twitter:description",
        content:
          "Calculate annual SaaS spend, monthly subscription burn, and hidden recurring expenses with a private browser-based tracker.",
      },
      {
        name: "keywords",
        content:
          "subscription cost calculator, SaaS subscription tracker, annual SaaS spend, monthly subscription calculator, recurring expenses calculator, subscription overhead",
      },
    ],
  }),
  component: Index,
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  TYPES + SEED DATA                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

type Category = "SAAS" | "ENTERTAINMENT" | "UTILITIES" | "STORAGE";
const CATEGORIES: Category[] = [
  "SAAS",
  "ENTERTAINMENT",
  "UTILITIES",
  "STORAGE",
];
type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY";
type FormatCurrency = (n: number) => string;

const CURRENCIES: {
  code: CurrencyCode;
  label: string;
  locale: string;
  fractionDigits: number;
  sliderMax: number;
}[] = [
  {
    code: "USD",
    label: "USD",
    locale: "en-US",
    fractionDigits: 2,
    sliderMax: 300,
  },
  {
    code: "INR",
    label: "INR",
    locale: "en-IN",
    fractionDigits: 2,
    sliderMax: 25000,
  },
  {
    code: "EUR",
    label: "EUR",
    locale: "de-DE",
    fractionDigits: 2,
    sliderMax: 300,
  },
  {
    code: "GBP",
    label: "GBP",
    locale: "en-GB",
    fractionDigits: 2,
    sliderMax: 300,
  },
  {
    code: "CAD",
    label: "CAD",
    locale: "en-CA",
    fractionDigits: 2,
    sliderMax: 400,
  },
  {
    code: "AUD",
    label: "AUD",
    locale: "en-AU",
    fractionDigits: 2,
    sliderMax: 500,
  },
  {
    code: "JPY",
    label: "JPY",
    locale: "ja-JP",
    fractionDigits: 0,
    sliderMax: 50000,
  },
];

const SEO_FAQ_ITEMS = [
  {
    question: "Is my financial data safe in this subscription tracker?",
    answer:
      "Yes. MONITOR stores subscription records in localStorage, which means the data stays in your browser and is not sent to a server by this app.",
  },
  {
    question: "How do I calculate annual subscription overhead?",
    answer:
      "Add every monthly subscription fee together, then multiply that monthly total by 12. For annual plans, divide the yearly price by 12 if you want a monthly burn rate.",
  },
  {
    question: "What counts as hidden subscription burn?",
    answer:
      "Hidden burn includes small recurring charges that are easy to forget, such as streaming apps, cloud storage, app trials that converted, software seats, and utilities billed automatically.",
  },
  {
    question: "Should I track monthly billing or annual billing?",
    answer:
      "Track both. Monthly billing shows your current cash flow, while annual billing shows the real long-term cost of SaaS tools and subscriptions over a full year.",
  },
] as const;

const SEO_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "MONITOR",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Any",
      description:
        "A free browser-based SaaS subscription cost calculator for estimating monthly burn, annual subscription overhead, and hidden recurring expenses.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Monthly subscription cost calculator",
        "Annual SaaS spend projection",
        "Category breakdown for recurring expenses",
        "Local browser storage for private tracking",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: SEO_FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
};

interface Sub {
  id: string;
  name: string;
  fee: number;
  category: Category;
}

const SEED: Sub[] = [
  { id: "s1", name: "Streaming Base", fee: 14.99, category: "ENTERTAINMENT" },
  { id: "s2", name: "Cloud Vault 2TB", fee: 9.99, category: "STORAGE" },
  { id: "s3", name: "Design Suite", fee: 54.99, category: "SAAS" },
  { id: "s4", name: "Fiber Uplink", fee: 79.0, category: "UTILITIES" },
  { id: "s5", name: "Music Tier", fee: 11.99, category: "ENTERTAINMENT" },
  { id: "s6", name: "Code Assistant", fee: 20.0, category: "SAAS" },
];

const STORAGE_KEY = "monitor.subs.v1";
const CURRENCY_STORAGE_KEY = "monitor.currency.v1";

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && CURRENCIES.some((c) => c.code === value);
}

function getCurrencyConfig(code: CurrencyCode) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

function loadSubs(): Sub[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED;
    return parsed.filter(isValidSub);
  } catch {
    return SEED;
  }
}

function loadCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "USD";
  try {
    const raw = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return isCurrencyCode(raw) ? raw : "USD";
  } catch {
    return "USD";
  }
}

function isValidSub(x: unknown): x is Sub {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.fee === "number" &&
    typeof o.category === "string" &&
    (CATEGORIES as string[]).includes(o.category)
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  ODOMETER — rolling digit counter                                          */
/* ────────────────────────────────────────────────────────────────────────── */

function Odometer({
  value,
  formatCurrency,
}: {
  value: number;
  formatCurrency: FormatCurrency;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef({ v: 0 });
  const flashRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obj = ref.current;
    const tween = gsap.to(obj, {
      v: value,
      duration: 1.1,
      ease: "power3.out",
      onUpdate: () => setDisplay(obj.v),
    });
    if (flashRef.current) {
      gsap.fromTo(
        flashRef.current,
        { color: "var(--color-primary)" },
        { color: "var(--color-foreground)", duration: 1.4, ease: "power2.out" },
      );
    }
    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <span
      ref={flashRef}
      className="font-display tabular-nums inline-block overflow-hidden"
      style={{ lineHeight: 0.9 }}
    >
      {formatCurrency(display)}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  FORECAST CHART — animated SVG line graph (12-month compounding)          */
/* ────────────────────────────────────────────────────────────────────────── */

function ForecastChart({
  monthly,
  formatCurrency,
}: {
  monthly: number;
  formatCurrency: FormatCurrency;
}) {
  const W = 520;
  const H = 360;
  const PAD_L = 56;
  const PAD_R = 24;
  const PAD_T = 32;
  const PAD_B = 40;

  const points = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => monthly * (i + 1));
    const max = Math.max(arr[arr.length - 1] || 1, 1);
    return arr.map((v, i) => {
      const x = PAD_L + ((W - PAD_L - PAD_R) * i) / 11;
      const y = PAD_T + (H - PAD_T - PAD_B) * (1 - v / max);
      return { x, y, v };
    });
  }, [monthly]);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const area = `${path} L ${points[points.length - 1].x} ${H - PAD_B} L ${points[0].x} ${H - PAD_B} Z`;

  const pathRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    gsap.fromTo(
      pathRef.current,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 1.2, ease: "power3.out" },
    );
  }, [monthly]);

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD_T + (H - PAD_T - PAD_B) * t;
        return (
          <line
            key={t}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y}
            y2={y}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        );
      })}
      {/* y axis labels */}
      {[0, 0.5, 1].map((t) => {
        const max = points[points.length - 1].v;
        const v = max * (1 - t);
        const y = PAD_T + (H - PAD_T - PAD_B) * t;
        return (
          <text
            key={t}
            x={PAD_L - 10}
            y={y + 4}
            textAnchor="end"
            className="font-mono"
            fontSize="10"
            fill="var(--color-muted-foreground)"
          >
            {formatCurrency(v)}
          </text>
        );
      })}
      {/* area fill */}
      <path d={area} fill="var(--color-primary)" opacity="0.08" />
      {/* line */}
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={1.5}
      />
      {/* points */}
      {points.map((p, i) => (
        <g key={i}>
          <rect
            x={p.x - 2.5}
            y={p.y - 2.5}
            width={5}
            height={5}
            fill="var(--color-background)"
            stroke="var(--color-primary)"
            strokeWidth={1.25}
          />
          <text
            x={p.x}
            y={H - PAD_B + 16}
            textAnchor="middle"
            fontSize="9"
            className="font-mono"
            fill="var(--color-muted-foreground)"
          >
            {months[i]}
          </text>
        </g>
      ))}
      {/* terminal value */}
      <text
        x={points[11].x}
        y={points[11].y - 12}
        textAnchor="end"
        fontSize="11"
        className="font-mono"
        fill="var(--color-primary)"
      >
        {formatCurrency(points[11].v)}
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  LEDGER CARD                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function LedgerCard({
  sub,
  index,
  onChange,
  onDelete,
  currency,
  formatCurrency,
  feeMax,
}: {
  sub: Sub;
  index: number;
  onChange: (s: Sub) => void;
  onDelete: (id: string) => void;
  currency: CurrencyCode;
  formatCurrency: FormatCurrency;
  feeMax: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: 36, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        delay: index * 0.1,
        ease: "cubic-bezier(0.25, 1, 0.5, 1)" as unknown as string,
      },
    );
  }, [index]);

  const handleDelete = () => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      scaleY: 0,
      opacity: 0,
      height: 0,
      marginTop: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: 0.45,
      ease: "cubic-bezier(0.25, 1, 0.5, 1)" as unknown as string,
      transformOrigin: "top center",
      onComplete: () => onDelete(sub.id),
    });
  };

  return (
    <div
      ref={ref}
      className="border border-border bg-card group relative"
      style={{ overflow: "hidden" }}
    >
      {/* index gutter */}
      <div className="grid grid-cols-[64px_1fr]">
        <div className="border-r border-border flex flex-col items-center justify-center py-6">
          <span className="font-mono text-[10px] text-muted-foreground">
            IDX
          </span>
          <span className="font-mono text-lg tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* row 1: name + delete */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground block mb-1">
                SERVICE_NAME
              </label>
              <FocusInput
                value={sub.name}
                onChange={(v) => onChange({ ...sub, name: v })}
              />
            </div>
            <button
              onClick={handleDelete}
              className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground hover:text-destructive transition-colors px-2 py-1 border border-border hover:border-destructive"
              aria-label="Delete subscription"
            >
              ✕ TERMINATE
            </button>
          </div>

          {/* row 2: fee slider + readouts */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                MONTHLY_FEE // {currency}
              </label>
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-xs text-muted-foreground">
                  /mo&nbsp;
                  <span className="text-foreground">
                    {formatCurrency(sub.fee)}
                  </span>
                </span>
                <span className="font-mono text-xs">
                  /yr&nbsp;
                  <span className="text-primary">
                    {formatCurrency(sub.fee * 12)}
                  </span>
                </span>
              </div>
            </div>
            <FeeSlider
              value={sub.fee}
              max={feeMax}
              onChange={(v) => onChange({ ...sub, fee: v })}
            />
          </div>

          {/* row 3: category presets */}
          <div>
            <label className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground block mb-2">
              CATEGORY
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const active = c === sub.category;
                return (
                  <button
                    key={c}
                    onClick={() => onChange({ ...sub, category: c })}
                    className={
                      "font-mono text-[10px] tracking-[0.18em] px-2.5 py-1.5 border transition-all duration-200 " +
                      (active
                        ? "border-primary text-primary-foreground bg-primary"
                        : "border-border text-muted-foreground hover:border-primary hover:text-foreground")
                    }
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  FOCUS INPUT — elastic border expand on focus                              */
/* ────────────────────────────────────────────────────────────────────────── */

function FocusInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="w-full bg-transparent font-mono text-base text-foreground py-1.5 outline-none border-b border-border focus:border-primary transition-all duration-300"
        style={{
          transform: focus ? "translateZ(0) translateX(2px)" : "translateX(0)",
          transition: "transform 320ms cubic-bezier(0.25, 1, 0.5, 1)",
          letterSpacing: focus ? "0.02em" : "0",
        }}
      />
      <span
        className="absolute left-0 bottom-0 h-px bg-primary"
        style={{
          width: focus ? "100%" : "0%",
          transition: "width 420ms cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  FEE SLIDER — technical numeric                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function FeeSlider({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const fill = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="monitor-range flex-1"
        style={{
          background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${fill}%, var(--color-border) ${fill}%, var(--color-border) 100%)`,
        }}
      />
      <input
        type="number"
        value={value}
        step={0.01}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-24 bg-transparent border border-border font-mono text-sm text-foreground px-2 py-1 text-right outline-none focus:border-primary"
      />
    </div>
  );
}

function CurrencySelect({
  value,
  onChange,
}: {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
        BASE_CCY
      </label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (isCurrencyCode(next)) onChange(next);
        }}
      >
        <SelectTrigger
          aria-label="Base currency"
          className="h-8 w-[94px] rounded-none border-border bg-background px-2 py-0 font-mono text-[10px] tracking-[0.18em] text-foreground shadow-none focus:ring-1 focus:ring-primary [&>svg]:text-primary [&>svg]:opacity-100"
        >
          <span>{value}</span>
        </SelectTrigger>
        <SelectContent className="rounded-none border-border bg-card font-mono text-[10px] tracking-[0.18em] text-foreground shadow-none">
          {CURRENCIES.map((currency) => (
            <SelectItem
              key={currency.code}
              value={currency.code}
              className="rounded-none py-2 pl-2 pr-8 text-[10px] tracking-[0.18em] focus:bg-primary focus:text-primary-foreground"
            >
              {currency.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SeoContent() {
  return (
    <section className="border-t border-border bg-background">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16">
        <div className="flex items-center gap-3 mb-10">
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
            [004] // SUBSCRIPTION_COST_GUIDE
          </span>
          <span className="flex-1 h-px hairline" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          <article className="max-w-3xl">
            <h2 className="font-display text-3xl md:text-5xl leading-tight uppercase">
              How to Calculate Your Annual SaaS and Subscription Overhead
            </h2>
            <p className="mt-6 text-base leading-7 text-muted-foreground">
              Subscription overhead is the total cost of recurring tools,
              software, utilities, storage, and entertainment services over
              time. A monthly fee can look harmless in isolation, but a stack of
              small recurring charges can quietly become a large annual expense.
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              To estimate your true annual SaaS spend, list every active
              subscription, enter the current monthly fee, and group each item
              by category. The calculator turns that ledger into monthly burn,
              weekly average, daily average, and a five-year projection so the
              recurring cost is easier to audit.
            </p>

            <div className="my-8 border border-border bg-card p-5">
              <h3 className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                SUBSCRIPTION_OVERHEAD_FORMULA
              </h3>
              <p className="mt-3 font-mono text-sm md:text-base text-foreground">
                Annual overhead = monthly subscription total x 12
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                For annual plans, divide the yearly renewal by 12 to compare it
                against monthly billing. For monthly plans, multiply by 12 to
                reveal the real yearly cost.
              </p>
            </div>

            <h3 className="font-display text-2xl mt-10 uppercase">
              Monthly Billing vs Annual Billing
            </h3>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Monthly billing is useful for cash-flow planning because it shows
              what leaves your account each month. Annual billing is useful for
              budget planning because it shows the full cost of keeping a tool
              or service for a complete year. Tracking both views prevents a
              discount from hiding a renewal you no longer need.
            </p>

            <h3 className="font-display text-2xl mt-10 uppercase">
              Find Hidden Burn Before It Compounds
            </h3>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Hidden burn usually comes from subscriptions that are too small to
              question: a forgotten streaming app, an extra cloud storage tier,
              an old software seat, or a free trial that converted. Reviewing
              these recurring expenses every month can save hundreds of dollars
              a year without changing anything important.
            </p>
          </article>

          <aside className="border border-border bg-card self-start">
            <div className="border-b border-border px-5 py-3 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
              QUICK_AUDIT_CHECKLIST
            </div>
            <ol className="divide-y divide-border">
              {[
                "List every recurring app, tool, storage plan, and utility.",
                "Normalize annual renewals into a monthly equivalent.",
                "Group expenses by SaaS, entertainment, utilities, and storage.",
                "Review unused subscriptions before the next renewal date.",
              ].map((item, index) => (
                <li key={item} className="flex gap-4 px-5 py-4">
                  <span className="font-mono text-xs text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-6 text-muted-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        <div className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display text-2xl md:text-3xl uppercase">
              Subscription Cost Calculator FAQ
            </h2>
            <span className="flex-1 h-px hairline" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            {SEO_FAQ_ITEMS.map((item) => (
              <div key={item.question} className="bg-background p-5">
                <h3 className="font-mono text-[11px] tracking-[0.18em] text-foreground">
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  MAIN APP                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function Index() {
  const [subs, setSubs] = useState<Sub[]>(SEED);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [hydrated, setHydrated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const currencyConfig = useMemo(() => getCurrencyConfig(currency), [currency]);
  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat(currencyConfig.locale, {
      style: "currency",
      currency,
      minimumFractionDigits: currencyConfig.fractionDigits,
      maximumFractionDigits: currencyConfig.fractionDigits,
    });
    return (value: number) => formatter.format(value);
  }, [currency, currencyConfig]);

  // hydrate from localStorage on mount (client only)
  useEffect(() => {
    setSubs(loadSubs());
    setCurrency(loadCurrency());
    setHydrated(true);
  }, []);

  // persist on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
    } catch {
      // quota / disabled — silent
    }
  }, [subs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
      // quota / disabled — silent
    }
  }, [currency, hydrated]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const exportJSON = () => {
    const payload = {
      app: "MONITOR",
      version: 1,
      exportedAt: new Date().toISOString(),
      currency,
      subscriptions: subs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitor-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    flash(`EXPORT_OK // ${subs.length} RECORDS`);
  };

  const importJSON = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const list: unknown = Array.isArray(data) ? data : data?.subscriptions;
      if (!Array.isArray(list)) throw new Error("invalid");
      const cleaned = list.filter(isValidSub);
      if (!cleaned.length) throw new Error("empty");
      if (!Array.isArray(data) && isCurrencyCode(data?.currency)) {
        setCurrency(data.currency);
      }
      setSubs(cleaned);
      flash(`IMPORT_OK // ${cleaned.length} RECORDS`);
    } catch {
      flash("IMPORT_FAIL // INVALID JSON");
    }
  };

  const totalMonthly = subs.reduce((s, x) => s + x.fee, 0);
  const totalAnnual = totalMonthly * 12;

  // Page-load calibration timeline
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".calibrate-line", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
      });
      gsap.from(".calibrate-fade", {
        opacity: 0,
        y: 18,
        duration: 0.9,
        ease: "cubic-bezier(0.25, 1, 0.5, 1)" as unknown as string,
        stagger: 0.06,
        delay: 0.2,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const addSub = () => {
    setSubs((s) => [
      ...s,
      {
        id: "s" + Math.random().toString(36).slice(2, 8),
        name: "New Service",
        fee: 9.99,
        category: "SAAS",
      },
    ]);
  };

  const updateSub = (next: Sub) =>
    setSubs((s) => s.map((x) => (x.id === next.id ? next : x)));
  const deleteSub = (id: string) =>
    setSubs((s) => s.filter((x) => x.id !== id));

  const categoryBreakdown = CATEGORIES.map((c) => ({
    c,
    total: subs.filter((s) => s.category === c).reduce((a, b) => a + b.fee, 0),
  }));

  return (
    <div ref={rootRef} className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SEO_JSON_LD) }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importJSON(f);
          e.target.value = "";
        }}
      />
      <style>{`
        .monitor-range {
          -webkit-appearance: none;
          appearance: none;
          height: 2px;
          outline: none;
          cursor: pointer;
        }
        .monitor-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 18px;
          background: var(--color-primary);
          border: 1px solid var(--color-primary);
          cursor: grab;
        }
        .monitor-range::-moz-range-thumb {
          width: 12px;
          height: 18px;
          background: var(--color-primary);
          border: 1px solid var(--color-primary);
          cursor: grab;
          border-radius: 0;
        }
        .grid-bg {
          background-image:
            linear-gradient(to right, var(--color-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-border) 1px, transparent 1px);
          background-size: 80px 80px;
          opacity: 0.25;
        }
      `}</style>

      {/* TOP BAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 min-h-14 py-3 md:h-14 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="w-2 h-2 bg-primary" />
            <span className="font-display text-sm tracking-[0.18em]">
              MONITOR
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground tracking-[0.18em]">
              v1.0 // PURE SUBSCRIPTION TRACKER
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
            <CurrencySelect value={currency} onChange={setCurrency} />
            <span>SYS_TIME // {new Date().toISOString().slice(0, 10)}</span>
            <span className="hidden md:inline">
              SIGNAL // <span className="text-primary">●</span> ONLINE
            </span>
          </div>
        </div>
        <div className="calibrate-line h-px hairline w-full" />
      </header>

      {/* HERO MATRIX SUMMARY */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="relative max-w-[1440px] mx-auto px-6 lg:px-10 pt-16 pb-20">
          <div className="flex items-center gap-3 calibrate-fade">
            <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
              [001] // MATRIX_SUMMARY
            </span>
            <span className="flex-1 h-px hairline" />
            <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
              ACTIVE_RECORDS // {String(subs.length).padStart(2, "0")}
            </span>
          </div>

          <h1 className="font-display font-bold mt-8 calibrate-fade text-[clamp(2rem,5vw,4rem)] leading-[0.95] tracking-[-0.02em] uppercase">
            Subscription Cost
            <br />
            Calculator
          </h1>
          <p className="mt-5 max-w-2xl font-mono text-xs leading-6 tracking-[0.08em] text-muted-foreground calibrate-fade">
            CALCULATE_ANNUAL_SAAS_SPEND // TRACK_MONTHLY_BURN //
            FIND_HIDDEN_RECURRING_COSTS
          </p>

          <div className="mt-8 calibrate-fade">
            <div className="font-display font-extrabold text-[clamp(4rem,14vw,11rem)] leading-[0.85]">
              <Odometer value={totalAnnual} formatCurrency={formatCurrency} />
            </div>
          </div>

          <div className="calibrate-line h-px hairline w-full mt-12" />

          {/* KPI ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mt-px">
            {[
              { l: "MONTHLY_BURN", v: formatCurrency(totalMonthly), s: "/mo" },
              {
                l: "WEEKLY_AVG",
                v: formatCurrency(totalMonthly / 4.345),
                s: "/wk",
              },
              {
                l: "DAILY_AVG",
                v: formatCurrency(totalMonthly / 30.44),
                s: "/day",
              },
              {
                l: "5_YEAR_PROJ",
                v: formatCurrency(totalAnnual * 5),
                s: "/5yr",
              },
            ].map((k) => (
              <div key={k.l} className="bg-background px-4 py-5 calibrate-fade">
                <div className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                  {k.l}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-2xl md:text-3xl tabular-nums">
                    {k.v}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {k.s}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT: LEDGER + FIXED CHART */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16">
        <div className="flex items-center gap-3 mb-10">
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
            [002] // INTERACTIVE_LEDGER × [003] // FORECAST_ENGINE
          </span>
          <span className="flex-1 h-px hairline" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-10">
          {/* LEDGER STREAM */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-xl tracking-[-0.01em]">
                INPUT_STREAM
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="font-mono text-[10px] tracking-[0.18em] px-3 py-2 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  ↧ IMPORT
                </button>
                <button
                  onClick={exportJSON}
                  className="font-mono text-[10px] tracking-[0.18em] px-3 py-2 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  ↥ EXPORT
                </button>
                <button
                  onClick={addSub}
                  className="font-mono text-[10px] tracking-[0.18em] px-3 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  + APPEND_RECORD
                </button>
              </div>
            </div>

            {subs.map((s, i) => (
              <LedgerCard
                key={s.id}
                sub={s}
                index={i}
                onChange={updateSub}
                onDelete={deleteSub}
                currency={currency}
                formatCurrency={formatCurrency}
                feeMax={currencyConfig.sliderMax}
              />
            ))}

            {subs.length === 0 && (
              <div className="border border-dashed border-border p-10 text-center font-mono text-xs text-muted-foreground">
                NO_RECORDS // APPEND TO BEGIN CALIBRATION
              </div>
            )}
          </div>

          {/* FIXED FORECAST */}
          <aside className="lg:sticky lg:top-20 self-start">
            <div className="border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                  ANNUAL_FORECAST // 12_MONTH_COMPOUND
                </span>
                <span className="w-1.5 h-1.5 bg-primary" />
              </div>
              <div className="p-5">
                <ForecastChart
                  monthly={totalMonthly}
                  formatCurrency={formatCurrency}
                />
              </div>
              <div className="border-t border-border grid grid-cols-2">
                <div className="px-5 py-4 border-r border-border">
                  <div className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    M01_BASELINE
                  </div>
                  <div className="font-display text-xl mt-1">
                    {formatCurrency(totalMonthly)}
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    M12_TERMINAL
                  </div>
                  <div className="font-display text-xl mt-1 text-primary">
                    {formatCurrency(totalAnnual)}
                  </div>
                </div>
              </div>
            </div>

            {/* CATEGORY BREAKDOWN */}
            <div className="border border-border bg-card mt-4">
              <div className="border-b border-border px-5 py-3 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                CATEGORY_DISTRIBUTION
              </div>
              <div className="p-5 flex flex-col gap-3">
                {categoryBreakdown.map((b) => {
                  const pct = totalMonthly ? (b.total / totalMonthly) * 100 : 0;
                  return (
                    <div key={b.c}>
                      <div className="flex justify-between font-mono text-[11px] mb-1">
                        <span className="text-muted-foreground tracking-[0.18em]">
                          {b.c}
                        </span>
                        <span className="tabular-nums">
                          {formatCurrency(b.total)}{" "}
                          <span className="text-muted-foreground">
                            ({pct.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1 bg-border relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary"
                          style={{
                            width: `${pct}%`,
                            transition:
                              "width 600ms cubic-bezier(0.25, 1, 0.5, 1)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <SeoContent />

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary" />
            <span className="font-display tracking-[0.18em] text-sm">
              MONITOR
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              // PURE. ANALYTICAL. WEIGHTED.
            </span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tracking-[0.18em]">
            DATA STORED LOCAL // NO TELEMETRY // BUILD 2026.06
          </div>
        </div>
      </footer>

      {/* TOAST */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 border border-primary bg-background/95 backdrop-blur px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-primary shadow-lg"
          style={{
            animation: "monitor-toast 220ms cubic-bezier(0.25,1,0.5,1)",
          }}
        >
          {toast}
        </div>
      )}
      <style>{`
        @keyframes monitor-toast {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
