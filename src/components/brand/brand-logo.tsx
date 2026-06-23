import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  tone?: "light" | "dark";
};

export function BrandLogo({ compact = false, tone = "light" }: BrandLogoProps) {
  return (
    <span className="flex items-center gap-3">
      <span className="relative size-9 overflow-hidden rounded-lg shadow-sm">
        <Image
          src="/brand/zyrelo-logo-mark.svg"
          alt="Zyrelo"
          fill
          sizes="36px"
          priority
        />
      </span>
      {!compact ? (
        <span>
          <span className="block font-heading text-sm font-semibold leading-none">
            Zyrelo
          </span>
          <span
            className={
              tone === "dark"
                ? "text-xs text-sidebar-foreground/60"
                : "text-xs text-muted-foreground"
            }
          >
            Channel automation
          </span>
        </span>
      ) : null}
    </span>
  );
}
