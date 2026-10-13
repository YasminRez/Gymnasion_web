import "./Logo.css";
export default function Logo({ variant = "default", className = "" }: { variant?: "default" | "white" | "symbol"; className?: string }) {
  return <span className={`ds-logo ds-logo--${variant} ${className}`} role="img" aria-label="Gymnasion">
    <img src={`/design-system/${variant === "symbol" ? "imgLogoSimbolo" : "imgMark"}.svg`} alt="" />
    {variant !== "symbol" && <span>gymnasion</span>}
  </span>;
}
