import type { TipoMetrica } from "./metric";

export type RoutineStatus = "ATIVA" | "ENCERRADA";

export interface RotinaResponse {
  id: string;
  titulo: string;
  modalidadeId: number;
  nomeModalidade: string;
  modalidade?: { id: number; nome: string };
  frequenciaSemanal: number;
  objetivos: string | null;
  status?: RoutineStatus;
  ativo?: boolean;
  alunos: { id: string; nome: string | null }[];
  metricas: { id: string; titulo: string; tipo: TipoMetrica; obrigatoria?: boolean; quemPreenche?: "ALUNO" | "PERSONAL" | "AMBOS" }[];
}

export interface CriarRotinaPayload {
  titulo: string;
  modalidadeId: number;
  frequenciaSemanal: number;
  objetivos: string;
  alunosIds: string[];
  metricasIds: string[];
}

export interface ReutilizarRotinaPayload {
  alunoId: string;
  dataInicio: string; // YYYY-MM-DD
  titulo: string;
  objetivos: string;
}

export interface SessaoTreinoPlanejadaDTO {
  id: string;
  semana: number;
  dataPlanejada: string;
  duracao: number;
  atividades: string;
  status: string;
}

export interface PlanejamentoSemanaDTO {
  numero: number;
  sessoes: SessaoTreinoPlanejadaDTO[];
}

export interface PlanejamentoRotinaResponseDTO {
  rotinaId: string;
  tituloRotina: string;
  semanas: PlanejamentoSemanaDTO[];
}
