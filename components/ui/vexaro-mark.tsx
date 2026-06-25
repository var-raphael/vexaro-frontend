import Image from "next/image";

/**
 * VexaroMark
 *
 * Reusable animated Vexaro waveform logo mark.
 * Drop in anywhere — pass a size and optional className.
 *
 * Usage:
 *   <VexaroMark />              // default 32px
 *   <VexaroMark size={20} />    // navbar icon size
 *   <VexaroMark size={96} />    // hero / splash
 */
export function VexaroMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/quorel-mark.svg"
      alt="Vexaro"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

/**
 * VexaroWordmark
 *
 * Full wordmark — animated mark + logotype.
 * The mark scales with the font; pass textSize to control.
 *
 * Usage:
 *   <VexaroWordmark />
 *   <VexaroWordmark markSize={44} textSize="text-2xl" />
 */
export function VexaroWordmark({
  markSize = 36,
  textSize = "text-xl",
  className,
}: {
  markSize?: number;
  textSize?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <VexaroMark size={markSize} />
      <span
        className={`font-bold tracking-tight text-foreground ${textSize}`}
        style={{ letterSpacing: "-0.045em" }}
      >
        <span className="text-primary">V</span>exaro
      </span>
    </div>
  );
}