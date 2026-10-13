import { useState } from "react";
import "./Avatar.css";
export type AvatarProps = { name: string; initials?: string; src?: string; tone?: "primary" | "info"; className?: string };
export default function Avatar({ name, initials, src, tone = "primary", className = "" }: AvatarProps) {
  const [failedSource, setFailedSource] = useState<string>();
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = initials || [words[0]?.[0], words.length > 1 ? words[words.length - 1]?.[0] : ""].join("").toLocaleUpperCase("pt-BR") || "?";
  return <span className={`ds-avatar ds-avatar--${tone} ${className}`} role="img" aria-label={name}>
    {src && failedSource !== src ? <img src={src} alt="" onError={() => setFailedSource(src)} /> : letters}
  </span>;
}
