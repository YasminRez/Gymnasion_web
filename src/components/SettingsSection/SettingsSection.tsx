import type { ReactNode } from "react";
import "./SettingsSection.css";
export default function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="settings-section"><header><h2>{title}</h2><p>{description}</p></header><div className="settings-section__body">{children}</div></section>;
}
