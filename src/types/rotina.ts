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
  rotinaTreinoId?: string;
  semana: number;
  dataPlanejada: string;
  dataReal?: string | null;
  duracao?: number | null;
  atividades: string;
  status: string;
  concluidaAluno?: boolean;
  validadaPersonal?: boolean;
  desempenho?: {
    id: string;
    nivelCansaco: number | null;
    registradoPor?: string;
    metricas?: {
      metricaId: string;
      titulo: string;
      tipo: string;
      valor: string;
    }[];
  } | null;
}

export interface PlanejamentoSemanaDTO {
  numeroSemana: number;
  sessoes: SessaoTreinoPlanejadaDTO[];
}

export interface PlanejamentoRotinaResponseDTO {
  rotinaId: string;
  tituloRotina: string;
  modalidadeId?: number;
  nomeModalidade?: string;
  frequenciaSemanal?: number;
  objetivos?: string | null;
  semanas: PlanejamentoSemanaDTO[];
}

export interface CriarSessaoTreinoPayload {
  semana: number;
  dataPlanejada: string; // YYYY-MM-DD
  duracao?: number | null;
  atividades?: string | null;
}

