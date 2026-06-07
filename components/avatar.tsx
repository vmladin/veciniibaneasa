const PALETTE = [
  { bg: "oklch(0.90 0.048 36)",  fg: "oklch(0.42 0.088 36)"  },
  { bg: "oklch(0.90 0.048 155)", fg: "oklch(0.42 0.088 155)" },
  { bg: "oklch(0.90 0.048 250)", fg: "oklch(0.42 0.088 250)" },
  { bg: "oklch(0.90 0.048 78)",  fg: "oklch(0.42 0.088 78)"  },
  { bg: "oklch(0.90 0.048 330)", fg: "oklch(0.42 0.088 330)" },
  { bg: "oklch(0.90 0.048 205)", fg: "oklch(0.42 0.088 205)" },
];

function nameHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  const { bg, fg } = PALETTE[nameHash(name) % PALETTE.length];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, color: fg, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: size * 0.34, letterSpacing: "-0.5px",
      }}
    >
      {initials(name)}
    </div>
  );
}
