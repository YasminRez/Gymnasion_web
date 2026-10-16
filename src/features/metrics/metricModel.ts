import type { MetricaResponseDTO, ResponsavelPreenchimento, TipoMetrica } from "../../types/metric";
import type { ModalidadeResponseDTO } from "../../types/modalidade";

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getMetricStudentCount(m: MetricaResponseDTO): number {
  return m.quantidadeAlunosComRegistro ?? m.quantidadeAlunosComRegistros ?? 0;
}

export function isMetricActive(m: MetricaResponseDTO): boolean {
  if (typeof m.descontinuada === "boolean") {
    return !m.descontinuada;
  }
  if (typeof m.ativo === "boolean") {
    return m.ativo;
  }
  return true;
}

export function getPreenchimentoLabel(quem?: ResponsavelPreenchimento): string {
  if (quem === "ALUNO") return "aluno";
  if (quem === "PERSONAL") return "personal";
  return "aluno e personal";
}

export function normalizeTipo(tipo: TipoMetrica | string): "NUMERICO" | "TEMPO" | "FREQUENCIA_CARDIACA" | "TEXTO" {
  if (tipo === "TEMPO_CRONOMETRO" || tipo === "TEMPO") return "TEMPO";
  if (tipo === "TEXTO_OBSERVACAO" || tipo === "TEXTO") return "TEXTO";
  if (tipo === "FREQUENCIA_CARDIACA") return "FREQUENCIA_CARDIACA";
  return "NUMERICO";
}

export function toBackendTipoMetrica(
  tipo: TipoMetrica | string
): "FREQUENCIA_CARDIACA" | "TEXTO" | "TEMPO" | "NUMERICO" {
  if (tipo === "TEMPO_CRONOMETRO" || tipo === "TEMPO") return "TEMPO";
  if (tipo === "TEXTO_OBSERVACAO" || tipo === "TEXTO") return "TEXTO";
  if (tipo === "FREQUENCIA_CARDIACA") return "FREQUENCIA_CARDIACA";
  return "NUMERICO";
}

export interface MetricTypeOption {
  value: TipoMetrica;
  title: string;
  subtitle: string;
}

export const METRIC_TYPE_OPTIONS: MetricTypeOption[] = [
  {
    value: "NUMERICO",
    title: "Numérico",
    subtitle: "Valores numéricos (ex.: kg, metros)",
  },
  {
    value: "TEMPO",
    title: "Tempo / Cronômetro",
    subtitle: "Formato mm:ss · calcula ritmo médio",
  },
  {
    value: "FREQUENCIA_CARDIACA",
    title: "Frequência cardíaca",
    subtitle: "Faixa plausível em bpm",
  },
  {
    value: "TEXTO",
    title: "Texto / Observação",
    subtitle: "Anotações livres do personal",
  },
];

export function getMetricTypeDetails(tipo: TipoMetrica | string): {
  key: "NUMERICO" | "TEMPO" | "FREQUENCIA_CARDIACA" | "TEXTO";
  title: string;
  subtitle: string;
} {
  const norm = normalizeTipo(tipo);
  switch (norm) {
    case "TEMPO":
      return {
        key: "TEMPO",
        title: "Tempo / Cronômetro",
        subtitle: "Formato mm:ss · calcula ritmo médio",
      };
    case "FREQUENCIA_CARDIACA":
      return {
        key: "FREQUENCIA_CARDIACA",
        title: "Frequência cardíaca",
        subtitle: "Faixa plausível em bpm",
      };
    case "TEXTO":
      return {
        key: "TEXTO",
        title: "Texto / Observação",
        subtitle: "Anotações livres do personal",
      };
    case "NUMERICO":
    default:
      return {
        key: "NUMERICO",
        title: "Numérico",
        subtitle: "Valores numéricos (ex.: kg, metros)",
      };
  }
}

export function isMetricDuplicate(
  titulo: string,
  modalidadeId: number,
  existingMetrics: MetricaResponseDTO[],
  currentMetricId?: string
): boolean {
  const clean = normalizeText(titulo);
  if (!clean) return false;
  return existingMetrics.some(
    (m) =>
      m.id !== currentMetricId &&
      m.modalidadeId === modalidadeId &&
      normalizeText(m.titulo) === clean
  );
}

export function metricModalityCounts(
  metrics: MetricaResponseDTO[],
  modalities: ModalidadeResponseDTO[],
  options?: { includeZero?: boolean; activeModalityId?: number | null }
): { id: number | null; nome: string; count: number }[] {
  const result: { id: number | null; nome: string; count: number }[] = [
    { id: null, nome: "Todas", count: metrics.length },
  ];

  for (const mod of modalities) {
    const count = metrics.filter((m) => m.modalidadeId === mod.id).length;
    // Apenas exibe esportes que possuam métricas cadastradas (count > 0)
    // ou se o esporte for o filtro atualmente selecionado na URL
    if (
      options?.includeZero ||
      count > 0 ||
      (options?.activeModalityId != null && options.activeModalityId === mod.id)
    ) {
      result.push({ id: mod.id, nome: mod.nome, count });
    }
  }

  return result;
}

export function filterMetrics(
  metrics: MetricaResponseDTO[],
  selectedModalityId: number | null,
  searchQuery: string = ""
): MetricaResponseDTO[] {
  let list = metrics;

  if (selectedModalityId !== null) {
    list = list.filter((m) => m.modalidadeId === selectedModalityId);
  }

  const cleanSearch = normalizeText(searchQuery);
  if (cleanSearch) {
    list = list.filter((m) => {
      const matchTitle = normalizeText(m.titulo).includes(cleanSearch);
      const matchMod = m.nomeModalidade ? normalizeText(m.nomeModalidade).includes(cleanSearch) : false;
      return matchTitle || matchMod;
    });
  }

  return list;
}

export function getModalityBadgeStyle(nome: string): { bg: string; color: string; icon: string } {
  const lower = normalizeText(nome || "");
  if (lower.includes("natacao")) {
    return { bg: "#eff8ff", color: "#175cd3", icon: "/design-system/imgIconWaves.svg" };
  }
  if (lower.includes("tenis")) {
    return { bg: "#f4fce3", color: "#598b00", icon: "/design-system/imgIconTennis.svg" };
  }
  if (lower.includes("academia") || lower.includes("musculacao")) {
    return { bg: "#f4f3ff", color: "#5925dc", icon: "/design-system/imgIconDumbbell.svg" };
  }
  return { bg: "#f2f4f7", color: "#344054", icon: "/design-system/imgIconGrid.svg" };
}
