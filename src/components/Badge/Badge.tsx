import type { HTMLAttributes } from "react";
import "./Badge.css";
export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info" | "primary";
const dots: Record<BadgeTone, string> = { success: "imgDot", warning: "imgDot1", danger: "imgDot2", neutral: "imgDot3", info: "imgDot4", primary: "imgDot5" };
export default function Badge({ tone = "success", children, className = "", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span {...props} className={`ds-badge ds-badge--${tone} ${className}`}><img src={`/design-system/${dots[tone]}.svg`} alt="" />{children}</span>;
}
