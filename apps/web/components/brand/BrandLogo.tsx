import Link from "next/link";
import { Rocket, Sparkles } from "lucide-react";

type BrandLogoSize = "sm" | "md" | "lg";
type BrandLogoTheme = "light" | "dark";
type BrandLogoVariant = "full" | "mark";

type BrandLogoProps = Readonly<{
  href?: string;
  showTagline?: boolean;
  size?: BrandLogoSize;
  theme?: BrandLogoTheme;
  variant?: BrandLogoVariant;
}>;

const BRAND = {
  accent: "#F59E0B",
  dark: "#020617",
  primary: "#6366F1",
  secondary: "#10B981",
  surface: "#0F172A"
} as const;

const SIZE_MAP: Record<
  BrandLogoSize,
  {
    dot: number;
    gap: string;
    icon: number;
    labelGap: string;
    mark: number;
    sparkle: number;
    subtitle: string;
    title: string;
  }
> = {
  lg: {
    dot: 12,
    gap: "1rem",
    icon: 28,
    labelGap: "0.35rem",
    mark: 68,
    sparkle: 14,
    subtitle: "0.8rem",
    title: "2rem"
  },
  md: {
    dot: 10,
    gap: "0.8rem",
    icon: 24,
    labelGap: "0.28rem",
    mark: 56,
    sparkle: 12,
    subtitle: "0.72rem",
    title: "1.5rem"
  },
  sm: {
    dot: 8,
    gap: "0.65rem",
    icon: 20,
    labelGap: "0.2rem",
    mark: 44,
    sparkle: 10,
    subtitle: "0.65rem",
    title: "1.15rem"
  }
};

function createMark(size: BrandLogoSize) {
  const dimensions = SIZE_MAP[size];
  const orbitInset = Math.round(dimensions.mark * 0.17);
  const iconTop = Math.round(dimensions.mark * 0.24);
  const iconLeft = Math.round(dimensions.mark * 0.24);

  return (
    <span
      aria-hidden="true"
      style={{
        background: `linear-gradient(145deg, ${BRAND.surface} 0%, ${BRAND.dark} 100%)`,
        borderRadius: "28%",
        boxShadow: "0 18px 40px rgba(99, 102, 241, 0.18)",
        display: "inline-flex",
        flexShrink: 0,
        height: dimensions.mark,
        position: "relative",
        width: dimensions.mark
      }}
    >
      <span
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.28), transparent 45%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "inherit",
          inset: 2,
          position: "absolute"
        }}
      />
      <span
        style={{
          border: `2px solid rgba(99, 102, 241, 0.5)`,
          borderRadius: 999,
          inset: orbitInset,
          position: "absolute"
        }}
      />
      <span
        style={{
          background: BRAND.secondary,
          border: "2px solid rgba(2, 6, 23, 0.84)",
          borderRadius: 999,
          boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.16)",
          height: dimensions.dot,
          position: "absolute",
          right: orbitInset - Math.round(dimensions.dot * 0.45),
          top: orbitInset - Math.round(dimensions.dot * 0.45),
          width: dimensions.dot
        }}
      />
      <span
        style={{
          alignItems: "center",
          color: "#FFFFFF",
          display: "inline-flex",
          inset: 0,
          justifyContent: "center",
          position: "absolute"
        }}
      >
        <Rocket
          size={dimensions.icon}
          strokeWidth={2.1}
          style={{
            filter: "drop-shadow(0 6px 16px rgba(99, 102, 241, 0.3))",
            left: iconLeft,
            position: "absolute",
            top: iconTop
          }}
        />
      </span>
      <Sparkles
        aria-hidden="true"
        color={BRAND.accent}
        size={dimensions.sparkle}
        strokeWidth={2.2}
        style={{
          bottom: Math.round(dimensions.mark * 0.14),
          left: Math.round(dimensions.mark * 0.14),
          position: "absolute"
        }}
      />
    </span>
  );
}

export function BrandLogo({
  href,
  showTagline = false,
  size = "md",
  theme = "light",
  variant = "full"
}: BrandLogoProps) {
  const dimensions = SIZE_MAP[size];
  const titleColor = theme === "dark" ? "#F8FAFC" : BRAND.surface;
  const subtitleColor = theme === "dark" ? "rgba(248, 250, 252, 0.72)" : "rgba(15, 23, 42, 0.64)";

  const content = (
    <span
      aria-label="BirthHub 360"
      style={{
        alignItems: "center",
        display: "inline-flex",
        gap: variant === "mark" ? "0" : dimensions.gap,
        textDecoration: "none"
      }}
    >
      {createMark(size)}
      {variant === "full" ? (
        <span
          style={{
            display: "inline-grid",
            gap: dimensions.labelGap,
            lineHeight: 1
          }}
        >
          <span
            style={{
              alignItems: "baseline",
              color: titleColor,
              display: "inline-flex",
              fontFamily: '"Outfit", "IBM Plex Sans", "Segoe UI", sans-serif',
              fontSize: dimensions.title,
              fontWeight: 800,
              letterSpacing: "-0.04em"
            }}
          >
            BirthHub
            <span
              style={{
                color: BRAND.primary,
                marginLeft: "0.35rem"
              }}
            >
              360
            </span>
          </span>
          {showTagline ? (
            <span
              style={{
                color: subtitleColor,
                fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
                fontSize: dimensions.subtitle,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase"
              }}
            >
              Governed Revenue Operations
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      style={{
        color: "inherit",
        display: "inline-flex",
        textDecoration: "none"
      }}
    >
      {content}
    </Link>
  );
}
