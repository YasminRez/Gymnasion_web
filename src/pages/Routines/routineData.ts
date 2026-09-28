import type { TipoMetrica } from "../../types/metric";

// Nomes de tipo exibidos na tela, na mesma ordem do enum do backend.
export const metricTypeOptions: { value: TipoMetrica; label: string }[] = [
  { value: "NUMERICO", label: "Numérico" },
  { value: "TEMPO", label: "Tempo/Cronômetro" },
  { value: "FREQUENCIA_CARDIACA", label: "Frequência cardíaca" },
  { value: "TEXTO", label: "Texto/Observação" },
];

export const metricTypeLabel = Object.fromEntries(metricTypeOptions.map((option) => [option.value, option.label])) as Record<TipoMetrica, string>;

export const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7];
