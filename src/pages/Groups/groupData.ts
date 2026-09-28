export type ModalityTheme = { background: string; text: string; badge: string; accent: string };

// Cores das modalidades do protótipo; as demais usam a paleta de apoio pelo id.
const knownThemes: Record<string, ModalityTheme> = {
  natacao: { background: "#e3eefb", text: "#2d5fa6", badge: "#c7dbf5", accent: "#6b8fc0" },
  tenis: { background: "#e6f4dd", text: "#3f6b25", badge: "#c9e5b5", accent: "#8aa874" },
  academia: { background: "#fbead6", text: "#8a5220", badge: "#f1d2ae", accent: "#c29a70" },
};
const fallbackThemes: ModalityTheme[] = [
  { background: "#ece8fb", text: "#4b3fa6", badge: "#d6cff5", accent: "#8a7fd0" },
  { background: "#fbe4ec", text: "#9a2d55", badge: "#f3c6d6", accent: "#c9829c" },
  { background: "#dff3f1", text: "#246b63", badge: "#bfe5e0", accent: "#6fb0a8" },
  { background: "#f6f2d6", text: "#6e6120", badge: "#ebe2a8", accent: "#b8a95e" },
];
const avatarColors = ["#4fb38a", "#3d8fd6", "#d9467a", "#f0a030", "#7b6fe0", "#e0663a"];

export const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function modalityTheme(name: string, id: number): ModalityTheme {
  return knownThemes[normalize(name)] ?? fallbackThemes[id % fallbackThemes.length];
}

export function avatarColor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return avatarColors[hash % avatarColors.length];
}

export function formatSchedule(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(/\.| de /g, (match) => (match === "." ? "" : " "));
  return `${day}, ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

// Converte o OffsetDateTime da API para o formato do input datetime-local (horário local).
export function toDateTimeLocal(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
