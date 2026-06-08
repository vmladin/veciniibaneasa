import type { Metadata } from "next";
import LatestSection from "./_components/LatestSection";

export const metadata: Metadata = {
  title: "Vecinii Băneasa — Platforma comunității",
  description:
    "Platforma digitală a comunității Băneasa. Director de furnizori, evenimente locale și anunțuri — tot ce ai nevoie pentru viața în cartier.",
};

/* ── Inline SVG icons ── */
function HouseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 11.5L12 3l9 8.5V20.5a.5.5 0 01-.5.5H15v-6H9v6H3.5a.5.5 0 01-.5-.5V11.5z"
        fill="var(--vb-accent)"
        fillOpacity="0.40"
        stroke="var(--vb-accent)"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconMegaphone() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

/* ── Feature card data ── */
const FEATURES = [
  {
    icon: <IconPeople />,
    title: "Director Furnizori",
    desc: "Instalatori, stomatologi, grădinari, zugravi și alte servicii recomandate și recenzate de vecinii tăi.",
    href: "/director",
    linkLabel: "Deschide directorul",
  },
  {
    icon: <IconCalendar />,
    title: "Evenimente",
    desc: "Petreceri de cartier, activități pentru copii. Fii la curent cu ce se întâmplă în Băneasa.",
    href: "/evenimente",
    linkLabel: "Deschide evenimentele",
  },
  {
    icon: <IconMegaphone />,
    title: "Anunțuri",
    desc: "Cumperi, vinzi sau oferi gratuit. Schimburi și servicii între vecini.",
    href: "/anunturi",
    linkLabel: "Deschide anunțurile",
  },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* ────────────── Header ────────────── */}
      <header className="lp-header">
        {/* Logo — links to homepage */}
        <a
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              background: "var(--vb-accent-lt)",
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HouseIcon />
          </div>
          <div>
            <div
              style={{ fontWeight: 900, fontSize: 16, color: "var(--vb-text)", lineHeight: 1.2 }}
            >
              Vecinii Băneasa
            </div>
            <div style={{ fontSize: 10.5, color: "var(--vb-text-l)", fontWeight: 600 }}>
              Comunitatea cartierului
            </div>
          </div>
        </a>
      </header>

      {/* ────────────── Hero ────────────── */}
      <section style={{ background: "var(--background)" }}>
        <div className="lp-hero">

          {/* Eyebrow badge */}
          <div
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--vb-accent)",
              marginBottom: 30,
            }}
          >
            Băneasa&nbsp;·&nbsp;Comunitate&nbsp;·&nbsp;Împreună
          </div>

          {/* Headline */}
          <h1 className="lp-h1-normal">Tot cartierul,</h1>
          <h1 className="lp-h1-italic">La un click distanță</h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 18,
              color: "var(--vb-text-m)",
              lineHeight: 1.65,
              maxWidth: 520,
              margin: "0 auto 0",
            }}
          >
            Platforma digitală a comunității Băneasa.<br />
            Furnizori de servicii de încredere recomandate chiar de vecinii tăi.
          </p>

        </div>
      </section>

      {/* ────────────── Latest activity ────────────── */}
      <LatestSection />

      {/* ────────────── Features ────────────── */}
      <section className="lp-section-features" id="functii">

        {/* Section heading */}
        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 900,
              color: "var(--vb-text)",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Tot ce îți trebuie
            <br />
            pentru viața în cartier
          </h2>
        </div>

        {/* Cards grid */}
        <div className="lp-features-grid">
          {FEATURES.map((f) => (
            <div className="lp-feat-card" key={f.title}>

              {/* Icon box */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: "var(--vb-accent-lt)",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--vb-accent)",
                }}
              >
                {f.icon}
              </div>

              {/* Availability badge */}
              <div className="lp-badge-avail">
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "oklch(0.48 0.12 145)",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                Disponibil acum
              </div>

              {/* Title + description */}
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "var(--vb-text)",
                    margin: "0 0 8px",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--vb-text-m)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>

              {/* Link */}
              <a href={f.href} className="lp-feat-link">
                {f.linkLabel} →
              </a>

            </div>
          ))}
        </div>

      </section>

      {/* ────────────── Footer ────────────── */}
      <footer className="lp-footer">
        <div style={{ fontSize: 13, color: "var(--vb-text-l)", fontWeight: 600 }}>
          © 2026 Vecinii Băneasa
        </div>
        <nav style={{ display: "flex", gap: 22 }}>
          {[
            { href: "/director", label: "Director" },
            { href: "/evenimente", label: "Evenimente" },
            { href: "/anunturi", label: "Anunțuri" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--vb-text-m)",
                textDecoration: "none",
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </footer>

    </div>
  );
}
