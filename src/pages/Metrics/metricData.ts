export const metricTypes = ["Numérico", "Tempo/Cronômetro", "Frequência cardíaca", "Texto/Observação"] as const;
export const metricSports = ["Natação", "Academia", "Tênis"] as const;
export type Metric = { id: string; title: string; sport: string; type: typeof metricTypes[number]; studentCount: number; discontinued: boolean };
export type MetricValues = Pick<Metric, "title" | "sport" | "type">;
export const initialMetrics: Metric[] = [
  { id: "demo-1", title: "Ritmo 100m", sport: "Natação", type: "Tempo/Cronômetro", studentCount: 5, discontinued: false },
  { id: "demo-2", title: "Carga utilizada", sport: "Academia", type: "Numérico", studentCount: 3, discontinued: false },
  { id: "demo-3", title: "Frequência após a sessão", sport: "Natação", type: "Frequência cardíaca", studentCount: 2, discontinued: false },
  { id: "demo-4", title: "Observações do saque", sport: "Tênis", type: "Texto/Observação", studentCount: 0, discontinued: false },
];
export function validateMetric(values: MetricValues, metrics: Metric[], original?: Metric) {
  const missing = [!values.sport && "Modalidade", !values.title.trim() && "Título", !values.type && "Tipo"].filter(Boolean);
  if (missing.length) return `Não é possível criar a métrica pois estão faltando os seguintes campos: ${missing.join(", ")}.`;
  if (!metricTypes.includes(values.type) || !metricSports.some((sport) => sport === values.sport)) return "Selecione uma modalidade e um tipo válidos.";
  if (original?.studentCount && (original.type !== values.type || original.sport !== values.sport)) return "Não é possível alterar o tipo de uma métrica com histórico de registros. Crie uma nova métrica.";
  const normalized = (value: string) => value.trim().normalize("NFC").toLocaleLowerCase("pt-BR");
  if (metrics.some((metric) => metric.id !== original?.id && metric.sport === values.sport && normalized(metric.title) === normalized(values.title))) return "Já existe uma métrica com esse nome nessa modalidade.";
  return "";
}
