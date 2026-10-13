import "./SportTag.css";
export type Sport = "natacao" | "tenis" | "academia" | "corrida" | "ciclismo" | "funcional";
const sports: Record<Sport, { label: string; icon: string }> = {
  natacao: { label: "Natação", icon: "imgIconWaves" }, tenis: { label: "Tênis", icon: "imgIconTennis" },
  academia: { label: "Academia", icon: "imgIconDumbbell1" }, corrida: { label: "Corrida", icon: "imgIconRun" },
  ciclismo: { label: "Ciclismo", icon: "imgIconBike" }, funcional: { label: "Funcional", icon: "imgIconTarget" },
};
export default function SportTag({ sport, className = "" }: { sport: Sport; className?: string }) {
  return <span className={`ds-sport-tag ds-sport-tag--${sport} ${className}`}><img src={`/design-system/${sports[sport].icon}.svg`} alt="" />{sports[sport].label}</span>;
}
