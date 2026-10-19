import "./SportTag.css";
export type Sport = "natacao" | "tenis" | "academia" | "corrida" | "ciclismo" | "funcional";
const sports: Record<Sport, { label: string; icon: string }> = {
  natacao: { label: "Natação", icon: "imgIconWaves" }, tenis: { label: "Tênis", icon: "imgIconTennis" },
  academia: { label: "Academia", icon: "imgIconDumbbell1" }, corrida: { label: "Corrida", icon: "imgIconRun" },
  ciclismo: { label: "Ciclismo", icon: "imgIconBike" }, funcional: { label: "Funcional", icon: "imgIconTarget" },
};
export default function SportTag({ sport, className = "" }: { sport?: string | null; className?: string }) {
  const label = sport?.trim() || "Modalidade não informada";
  const key = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const known = Object.prototype.hasOwnProperty.call(sports, key) ? sports[key as Sport] : undefined;
  return <span className={`ds-sport-tag ds-sport-tag--${known ? key : "neutral"} ${className}`}>{known && <img src={`/design-system/${known.icon}.svg`} alt="" />}{known?.label || label}</span>;
}
