import type { TipoMetrica } from "./metric";

export type StudentSessionStatus = "PLANEJADA" | "CONCLUIDA" | "VALIDADA";

export interface StudentSessionMetricResult {
  metricaId: string;
  titulo: string;
  tipo: TipoMetrica | string;
  valor: string;
  unidade?: string;
}

export interface StudentWorkoutSession {
  id: string;
  numero: number;
  semana: number;
  diaSemana: string;
  dataPlanejada: string; // DD/MM
  dataPlanejadaIso: string; // YYYY-MM-DD
  horario?: string;
  titulo: string;
  descricao: string;
  local?: string;
  duracaoPlanejada?: number;
  duracaoReal?: number | null;
  dataReal?: string | null;
  status: StudentSessionStatus;
  destaque?: boolean;
  rpe?: number | null;
  resultados?: StudentSessionMetricResult[];
}

export interface StudentRoutineWeek {
  numero: number;
  titulo: string;
  periodo: string;
  estado: "anterior" | "atual" | "bloqueada";
  disponivelEm?: string;
  sessoes: StudentWorkoutSession[];
}

export interface StudentHistoricalRoutine {
  id: string;
  titulo: string;
  periodo: string;
  semanas: number;
  status: "ENCERRADA";
  modalidade: string;
  objetivo: string;
  sessoesConcluidas: number;
}

export interface StudentFeedbackItem {
  id: string;
  autorNome: string;
  autorIniciais: string;
  tempoRelativo: string;
  conteudo: string;
  novo?: boolean;
}

export interface StudentWeekDaySummary {
  id: string;
  label: string;
  status: "completed" | "today" | "planned" | "rest";
}

export interface StudentEvolutionChart {
  id: string;
  titulo: string;
  subtitulo: string;
  valorPrincipal: string;
  unidade: string;
  badgeTexto: string;
  badgeTone: "success" | "neutral" | "warning" | "info" | "primary";
  cor: "blue" | "orange" | "red" | "purple";
  eixoX: string[];
  valores: number[];
}

export type EvolutionPeriodKey = "4w" | "3m" | "6m";

export interface StudentEvolutionPeriodData {
  key: EvolutionPeriodKey;
  label: string;
  bannerTexto: string;
  graficos: StudentEvolutionChart[];
}

export interface StudentEvolutionResponseDTO {
  alunoId: string;
  modalidadeId: number;
  modalidadeNome: string;
  totalSessoesAnalisadas: number;
  seriesRpe: { data: string; valor: number }[];
  seriesMetricas: {
    metricaId: string;
    metricaTitulo: string;
    tipo: string;
    pontos: { data: string; valor: string; valorNumerico: number }[];
    tendencia?: string;
  }[];
}

export interface StudentExecutionFormDTO {
  sessaoId: string;
  dataPlanejada: string;
  duracaoPlanejada: number | null;
  atividades: string;
  metricas: {
    id: string;
    titulo: string;
    tipo: TipoMetrica | string;
    obrigatoria: boolean;
    quemPreenche: "ALUNO" | "PERSONAL" | "AMBOS";
  }[];
}

export interface StudentExecutionPayloadDTO {
  dataReal: string;
  duracao: number | null;
  nivelCansaco: number | null;
  resultados: { metricaId: string; valor: string }[];
}

export interface StudentHistorySessionDTO {
  sessaoId: string;
  rotinaId: string;
  dataPlanejada: string;
  dataReal: string;
  duracao: number | null;
  nivelCansaco: number | null;
  validadoPeloPersonal: boolean;
  status: string;
  resultados: {
    metricaId: string;
    metricaTitulo: string;
    tipo: string;
    valor: string;
  }[];
}

export interface StudentFeedbackDTO {
  id: string;
  autorNome: string;
  autorRole: string;
  conteudo: string;
  dataHora: string;
}
